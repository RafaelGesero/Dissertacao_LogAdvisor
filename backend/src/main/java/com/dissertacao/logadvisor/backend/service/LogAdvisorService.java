package com.dissertacao.logadvisor.backend.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.dissertacao.logadvisor.backend.model.ArticleResult;
import com.dissertacao.logadvisor.backend.model.LogAdviceResponse;
import com.dissertacao.logadvisor.backend.model.LogSection;
import com.dissertacao.logadvisor.backend.model.SearchMode;
import com.dissertacao.logadvisor.backend.repository.ArticleRepository;
import com.dissertacao.logadvisor.backend.service.RulesFileService.Category;
import com.dissertacao.logadvisor.backend.service.RulesFileService.Match;
import com.dissertacao.logadvisor.backend.service.RulesFileService.MatchType;
import com.dissertacao.logadvisor.backend.service.RulesFileService.RuleItem;
import com.dissertacao.logadvisor.backend.service.RulesFileService.Source;
import com.dissertacao.logadvisor.backend.service.RulesFileService.TechSection;
import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.CosineSimilarity;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class LogAdvisorService {

    private static final String MANDATORY_SEARCH_TERMS = "security logging data protection information security";
    private static final String NO_INFO_MESSAGE = "Não foi encontrada informação relevante sobre o tema em questão";
    private static final int MAX_KB_TECHNOLOGIES = 4;
    private static final int MAX_KB_FETCH_PER_TECH = 100;
    private static final int MAX_SNIPPET_CHARS = 350;
    private static final int MAX_DESCRIPTION_IN_PROMPT = 2500;
    private static final int MAX_RULES_KEYWORDS = 8;
    private static final int MAX_RULES_SECTIONS = 6;
    private static final int NEW_ARTICLES_MAX_PAGES = 3;
    private static final double MAX_RATE_LIMIT_WAIT_SECONDS = 45;
    private static final Pattern RETRY_AFTER = Pattern.compile("try again in (?:(\\d+)m)?([\\d.]+)s");

    private final KnowledgeBaseService knowledgeBaseService;
    private final SerpApiService serpApiService;
    private final ChatLanguageModel chatLanguageModel;
    private final EmbeddingModel embeddingModel;
    private final RulesFileService rules;
    private final ArticleRepository articleRepository;
    private final Gson gson = new Gson();
    private final Map<String, Embedding> ruleEmbeddings = new ConcurrentHashMap<>();

    /**
     * Groq's free tier allows 8000 tokens per minute (input + output), and one request may not exceed it.
     * These budgets (in characters, ~3.8 chars per token) keep every prompt well below that limit.
     */
    @Value("${app.kb.prompt-budget-chars:7000}")
    private int kbPromptBudget;

    @Value("${app.rules.prompt-budget-chars:12000}")
    private int rulesPromptBudget;

    @Value("${app.kb.new-articles.per-technology:5}")
    private int newArticlesPerTechnology;

    public LogAdviceResponse getLoggingAdvice(String query, SearchMode mode) {
        LogAdviceResponse response = switch (mode) {
            case RULES -> adviceFromRulesFile(query);
            case KB -> adviceFromKnowledgeBase(query, false);
            case KB_WITH_NEW -> adviceFromKnowledgeBase(query, true);
        };
        response.setMode(mode.name());
        return response;
    }

    // ── Modes 1.2 and 1.3: knowledge base ────────────────────────────────────

    private LogAdviceResponse adviceFromKnowledgeBase(String query, boolean fetchNewArticles) {
        String rawKeywords = extractKeywords("""
                Extract 3 to %d concise technical keywords (languages, frameworks, databases, protocols) \
                from the following application description.
                Reply ONLY with the keywords separated by commas, nothing else. No punctuation at the end, no explanations.

                Description: %s
                """.formatted(MAX_KB_TECHNOLOGIES, clip(query)));
        List<String> technologies = parseKeywords(rawKeywords, MAX_KB_TECHNOLOGIES);
        log.info("Tecnologias extraídas: {}", technologies);

        List<ArticleResult> newArticles = fetchNewArticles ? addNewArticlesToKb(technologies) : new ArrayList<>();

        // Retrieve from the (possibly just enlarged) KB; every technology gets an equal share of the budget
        int perTechBudget = kbPromptBudget / Math.max(1, technologies.size());
        Map<String, List<String>> articlesByTech = new LinkedHashMap<>();
        List<ArticleResult> sources = new ArrayList<>();
        Set<String> seenLinks = new HashSet<>();

        for (String tech : technologies) {
            List<EmbeddingMatch<TextSegment>> matches =
                    knowledgeBaseService.search(tech + " " + MANDATORY_SEARCH_TERMS, MAX_KB_FETCH_PER_TECH);
            List<String> texts = new ArrayList<>();
            int used = 0;
            for (EmbeddingMatch<TextSegment> match : matches) {
                var meta = match.embedded().metadata();
                String link = meta.getString("link");
                String text = match.embedded().text();
                if (text == null || text.isBlank() || (link != null && !seenLinks.add(link))) continue;
                text = truncate(text);
                if (used + text.length() > perTechBudget) break;
                used += text.length();
                texts.add(text);

                ArticleResult ar = new ArticleResult();
                ar.setTitle(meta.getString("title"));
                ar.setLink(link);
                ar.setPublication(meta.getString("publication"));
                ar.setTechnology(tech);
                sources.add(ar);
            }
            articlesByTech.put(tech, texts);
            log.info("KB: {} artigos relevantes para '{}', {} usados no prompt", matches.size(), tech, texts.size());
        }

        String prompt = buildKnowledgeBasePrompt(query, technologies, articlesByTech);
        log.info("Prompt KB: {} caracteres", prompt.length());
        LogAdviceResponse response = parseResponse(callLlm(prompt), query);
        response.setSources(sources);
        response.setKeywords(String.join(", ", technologies));
        response.setNewArticles(newArticles);
        return response;
    }

    /**
     * Mode 1.3: for each technology, looks for up to {@code newArticlesPerTechnology} Google Scholar articles that
     * are not in the KB yet and stores them in the KB. Result pages are fetched one at a time (at most
     * {@code NEW_ARTICLES_MAX_PAGES}), so SerpAPI is only called while a technology still needs articles.
     */
    private List<ArticleResult> addNewArticlesToKb(List<String> technologies) {
        Set<String> seen = new HashSet<>();
        List<ArticleResult> found = new ArrayList<>();

        for (String tech : technologies) {
            int forTech = 0;
            for (int page = 0; page < NEW_ARTICLES_MAX_PAGES && forTech < newArticlesPerTechnology; page++) {
                List<ArticleResult> results = serpApiService.searchPage(tech + " " + MANDATORY_SEARCH_TERMS, page);
                if (results.isEmpty()) break;
                for (ArticleResult candidate : results) {
                    if (forTech >= newArticlesPerTechnology) break;
                    if (isNewArticle(candidate, seen)) {
                        candidate.setTechnology(tech);
                        found.add(candidate);
                        forTech++;
                    }
                }
            }
            log.info("Novos artigos para '{}': {} (máximo {})", tech, forTech, newArticlesPerTechnology);
        }

        if (!found.isEmpty()) knowledgeBaseService.saveArticles(found);
        log.info("Adicionados {} artigos novos à KB", found.size());
        return found;
    }

    /** Not seen in this search and not in the KB, by link or by title (the same paper often has several links). */
    private boolean isNewArticle(ArticleResult a, Set<String> seen) {
        String link = a.getLink();
        String title = a.getTitle() == null ? "" : a.getTitle().trim();
        if (link == null || link.isBlank() || title.isEmpty()) return false;
        if (!seen.add(link) || !seen.add("title:" + title.toLowerCase())) return false;
        return !articleRepository.existsByLink(link) && !articleRepository.existsByTitleIgnoreCase(title);
    }

    private String buildKnowledgeBasePrompt(String query, List<String> technologies, Map<String, List<String>> articlesByTech) {
        StringBuilder articles = new StringBuilder();
        articlesByTech.forEach((tech, texts) -> {
            articles.append("=== Articles for ").append(tech).append(" ===\n");
            if (texts.isEmpty()) articles.append("(no relevant article in the knowledge base)\n");
            texts.forEach(t -> articles.append(t).append("\n---\n"));
        });

        return """
                Reply ONLY with a valid JSON object. Do not include any text before or after it, no markdown, no explanations.
                The JSON must have exactly these four fields:

                {
                  "logStructure": [
                    {"technology": "TechName", "content": "..."},
                    ...
                  ],
                  "securityGuidance": "...",
                  "dataTypes": "...",
                  "storageTips": "..."
                }

                IMPORTANT: every value except "logStructure" and each "content" MUST be a plain string. \
                Use \\n for line breaks and "- " for bullet points inside strings. Do NOT use nested JSON objects inside field values.

                "logStructure": An ARRAY with one section for each of these technologies: %s. For each section:
                - "technology": the exact name of the technology as written above
                - "content": A structured string with EXACTLY these 4 labeled sections in this order, \
                  using \\n for line breaks, based EXCLUSIVELY on the academic articles of that technology. \
                  Use this exact format (replace placeholders with real content):\
                  Mandatory Fields: <comma-separated list of required log fields, e.g.: timestamp, level, service, userId, event, outcome, ipAddress>\\n\
                  Log Levels:\\n- INFO: <when to use INFO — describe events>\\n- WARN: <when to use WARN — describe events>\\n- ERROR: <when to use ERROR — describe events>\\n\
                  Security Events: <comma-separated list of security-specific events to log, e.g.: AUTH_SUCCESS, AUTH_FAILURE, AUTHZ_DENIED, DATA_ACCESS, SUSPICIOUS_ACTIVITY>\\n\
                  Log Template:\\n\
                  Schema: <one JSON object showing ALL mandatory fields with descriptive placeholders like <ISO-8601>, <hashed-id>, <success|failure>>\\n\
                  <EVENT_NAME> (INFO): <concrete single-line JSON example for an INFO-level security event>\\n\
                  <EVENT_NAME> (WARN): <concrete single-line JSON example for a WARN-level security event>\\n\
                  <EVENT_NAME> (ERROR): <concrete single-line JSON example for an ERROR-level security event>\\n\
                  Provide 3 or 4 event examples covering different log levels and security event types. \
                  Each example must include all mandatory fields. Values must be realistic but anonymised (hash user IDs). \
                  If the academic articles contain NO relevant information for that specific technology, \
                  set content to exactly: "%s"

                "securityGuidance": Security logging for this application: which security events must be logged \
                (authentication, authorisation, input validation, suspicious activity, administrative actions...), \
                where in the application and at which level, and what each security log entry must contain (who, what, when, outcome, reason).

                "dataTypes": The types of data this application handles that can end up in its logs \
                (credentials, tokens, personal data, IP addresses, payment or health data, identifiers, technical data...) \
                and, for each one, how to treat it: never log, hash, truncate, pseudonymise or can log — and why.

                "storageTips": Tips on how to store these logs securely and in compliance with regulations. Include:
                - What must NEVER appear in logs (personal data, credentials, payment data, etc.)
                - GDPR compliance: data minimisation, anonymisation, right to erasure
                - Recommended retention periods for each log type
                - Recommendations on encryption at rest and in transit, and access control for logs

                For "securityGuidance", "dataTypes" and "storageTips", base yourself on the academic articles first; \
                you may complement them with widely accepted practice, marking those points with "(general practice)".

                Academic articles:
                %s
                Application described by the user: %s
                """.formatted(String.join(", ", technologies), NO_INFO_MESSAGE, articles, clip(query));
    }

    // ── Mode 1.1: rules file ─────────────────────────────────────────────────

    private LogAdviceResponse adviceFromRulesFile(String query) {
        String rawKeywords = extractKeywords("""
                Extract up to %d concise keywords from the application description below: programming languages, \
                frameworks, libraries, databases, architecture (e.g. microservices, REST API, web application), \
                platforms (e.g. Android, Kubernetes), logging tools, and regulatory or business context \
                (e.g. healthcare, payments, GDPR). Use the usual English names.
                Reply ONLY with the keywords separated by commas, nothing else. No punctuation at the end, no explanations.

                Description: %s
                """.formatted(MAX_RULES_KEYWORDS, clip(query)));
        List<String> keywords = parseKeywords(rawKeywords, MAX_RULES_KEYWORDS);
        List<Match> matches = rules.match(keywords, query, MAX_RULES_SECTIONS);
        log.info("Ficheiro de regras: keywords {} -> secções {}", keywords,
                matches.stream().map(m -> m.section().id() + ":" + m.type()).toList());

        // Per-technology structure comes straight from the file's «Formato-modelo» and «Regras»
        List<LogSection> logStructure = new ArrayList<>();
        for (Match m : matches) logStructure.add(toLogSection(m));
        logStructure.add(new LogSection("Universal rules", "Key Rules:\n" + rules.items(Category.UNIVERSAL)
                .stream().map(RuleItem::text).collect(Collectors.joining("\n"))));

        // Security, data types and storage: the LLM adapts the most relevant rules of PARTES 3-5
        String relevanceQuery = rawKeywords + "\n" + clip(query);
        Set<String> events = new LinkedHashSet<>();
        matches.forEach(m -> events.addAll(m.section().securityEvents()));
        boolean regulated = matches.stream().anyMatch(m -> m.section().id().equals("regulated-systems"));

        int budget = rulesPromptBudget;
        List<String> security = new ArrayList<>();
        events.forEach(code -> {
            String line = rules.getEventCodes().get(code);
            if (line != null) security.add(line);
        });
        security.addAll(select(relevanceQuery, budget * 35 / 100 - length(security),
                regulated ? List.of(Category.SECURITY, Category.STANDARDS) : List.of(Category.SECURITY)));

        List<String> dataTypes = select(relevanceQuery, budget * 30 / 100,
                List.of(Category.DATA_TYPE, Category.ANONYMISATION));

        List<String> storage = new ArrayList<>();
        rules.items(Category.NEVER_LOG).forEach(i -> storage.add(i.text()));
        rules.items(Category.RETENTION).forEach(i -> storage.add(i.text()));
        storage.addAll(select(relevanceQuery, budget * 35 / 100 - length(storage),
                List.of(Category.GDPR, Category.ENCRYPTION)));

        String technologies = matches.stream()
                .map(m -> m.section().label() + " (" + m.type().name().toLowerCase() + ")")
                .collect(Collectors.joining(", "));

        String securityText;
        String dataText;
        String storageText;
        try {
            String prompt = buildRulesPrompt(query, technologies, security, dataTypes, storage);
            log.info("Prompt ficheiro de regras: {} caracteres", prompt.length());
            JsonObject obj = parseJsonObject(callLlm(prompt));
            securityText = extractStringField(obj, "securityGuidance");
            dataText = extractStringField(obj, "dataTypes");
            storageText = extractStringField(obj, "storageTips");
        } catch (Exception e) {
            // The per-technology part does not need the LLM, so the analysis is still useful without it
            log.warn("LLM indisponível no modo ficheiro de regras, a devolver as regras selecionadas: {}", e.getMessage());
            securityText = dataText = storageText = null;
        }
        String fallbackNote = "(LLM unavailable: showing the predefined rules selected for this application.)\n";
        if (isBlank(securityText)) securityText = fallbackNote + bullets(security);
        if (isBlank(dataText)) dataText = fallbackNote + bullets(dataTypes);
        if (isBlank(storageText)) storageText = fallbackNote + bullets(storage);

        List<String> cited = new ArrayList<>();
        logStructure.forEach(s -> cited.add(s.getContent()));
        cited.addAll(security);
        cited.addAll(dataTypes);
        cited.addAll(storage);

        LogAdviceResponse response = new LogAdviceResponse();
        response.setLogStructure(logStructure);
        response.setSecurityGuidance(securityText);
        response.setDataTypes(dataText);
        response.setStorageTips(storageText);
        response.setSources(rules.citedSources(cited).stream().map(this::toArticle).toList());
        response.setKeywords(String.join(", ", keywords.isEmpty()
                ? matches.stream().map(m -> m.section().label()).toList() : keywords));
        return response;
    }

    private LogSection toLogSection(Match m) {
        TechSection s = m.section();
        String by = String.join(", ", m.matchedBy());
        String evidence = switch (m.type()) {
            case DIRECT -> "Direct match" + (by.isEmpty() ? "" : " for " + by) + " in section «" + s.name()
                    + "». Evidence level of the section: " + s.evidence() + ".";
            case DERIVED -> "DERIVED: " + by + " is only recognised by derivation in section «" + s.name()
                    + "». This guidance was not studied for " + by + " in the articles.";
            case COMBINED -> "Related section («Combinar com» of " + by + "): «" + s.name()
                    + "». Evidence level of the section: " + s.evidence() + ".";
            case FALLBACK -> "No section of the predefined rules recognises "
                    + (by.isEmpty() ? "the technologies described" : by)
                    + ", so the generic baseline is used. There is no direct evidence: derive from the closest family "
                    + "(JVM → Java; .NET → C#; dynamic server languages → Python/JavaScript/PHP; native code → C/C++; mobile → Android).";
        };
        StringBuilder content = new StringBuilder("Evidence: ").append(evidence);
        if (!s.sources().isEmpty()) content.append("\nSection sources: ").append(String.join(", ", s.sources()));
        s.notes().forEach(n -> content.append("\n").append(n));
        if (!isBlank(s.limitations())) content.append("\nLimitations: ").append(s.limitations());
        content.append("\n");
        s.template().forEach(line -> content.append(line).append("\n"));
        content.append("Key Rules:\n").append(String.join("\n", s.rules()));

        String label = m.type() == MatchType.FALLBACK && !by.isEmpty() ? "Generic baseline (" + by + ")" : s.label();
        return new LogSection(label, content.toString());
    }

    private String buildRulesPrompt(String query, String technologies, List<String> security,
                                    List<String> dataTypes, List<String> storage) {
        return """
                You are LoggingAdvisor. Reply ONLY with a valid JSON object, no text before or after it, no markdown:
                {"securityGuidance": "...", "dataTypes": "...", "storageTips": "..."}
                Every value MUST be a plain string. Use \\n for line breaks and "- " for bullet points.

                Rules you must follow (from PARTE 1 of the LoggingAdvisor rules file):
                - The excerpts below are your ONLY source of knowledge. Do not add rules, numbers, standards, libraries or sources from memory.
                - Keep the rule IDs (e.g. S07, DT11, N01) and cite only the source keys present in the excerpts (e.g. [Sahin2024]). Reproduce numbers and percentages exactly as written, with their source.
                - When a rule is marked "derivada", say it is derived (an inference of LoggingAdvisor, not a claim of the authors).
                - Security and privacy rules prevail over convenience, performance or detail.
                - Never suggest logging data marked "Nunca registar"; suggest logging the event, an opaque identifier or a hash instead.
                - If the excerpts do not provide something (legal retention periods, ISO/NIST/OWASP control numbers, cipher algorithms), say that the rules file does not provide it.
                - Select only what is relevant to the described application; be short and actionable. Write in English; keep event codes and field names in English.

                "securityGuidance": which security events this application must log (use the event codes), where and at which level, \
                what every security log entry must contain, and the security practices that apply. Use the SECURITY excerpts.
                "dataTypes": the types of data this application handles that can end up in its logs and, for each one, how it must be \
                treated (never log / hash / truncate / pseudonymise / can log) and why. Use the DATA TYPES excerpts.
                "storageTips": how to store the logs: what must never be logged, GDPR (minimisation, anonymisation, right to erasure), \
                retention per log type, encryption in transit and at rest, and access control. Use the STORAGE excerpts.

                Technologies identified in the rules file: %s

                === SECURITY excerpts ===
                %s
                === DATA TYPES excerpts ===
                %s
                === STORAGE excerpts ===
                %s
                Application described by the user: %s
                """.formatted(technologies, String.join("\n", security), String.join("\n", dataTypes),
                String.join("\n", storage), clip(query));
    }

    /** The rules of the given categories most similar to the description, in file order, within {@code budget} chars. */
    private List<String> select(String relevanceQuery, int budget, List<Category> categories) {
        List<RuleItem> candidates = rules.getItems().stream()
                .filter(i -> categories.contains(i.category()))
                .toList();
        Embedding q = embeddingModel.embed(relevanceQuery).content();
        List<RuleItem> ranked = candidates.stream()
                .sorted(Comparator.comparingDouble((RuleItem i) -> -CosineSimilarity.between(q, embeddingOf(i))))
                .toList();

        Set<RuleItem> chosen = new HashSet<>();
        int used = 0;
        for (RuleItem i : ranked) {
            if (used + i.text().length() > budget) continue;
            chosen.add(i);
            used += i.text().length() + 1;
        }
        return candidates.stream().filter(chosen::contains).map(RuleItem::text).toList();
    }

    private Embedding embeddingOf(RuleItem item) {
        return ruleEmbeddings.computeIfAbsent(item.category() + ":" + item.id(),
                k -> embeddingModel.embed(item.text()).content());
    }

    private ArticleResult toArticle(Source s) {
        ArticleResult ar = new ArticleResult();
        ar.setTitle(s.citation());
        ar.setPublication(s.key() + " · " + s.reference());
        ar.setLink("");
        ar.setTechnology("");
        return ar;
    }

    // ── LLM helpers ──────────────────────────────────────────────────────────

    /**
     * Fails the whole search when the keywords cannot be extracted: using the raw description as "technologies"
     * would search SerpAPI and fill the KB with unrelated articles before failing anyway.
     */
    private String extractKeywords(String prompt) {
        return callLlm(prompt).trim().replaceAll("\\.$", "");
    }

    /**
     * Calls the LLM. When Groq answers "rate limit, try again in N s" with a short N, waits and retries once
     * (the limit is per minute); otherwise turns the failure into a message the user can act on.
     */
    private String callLlm(String prompt) {
        try {
            return chatLanguageModel.generate(prompt);
        } catch (RuntimeException e) {
            Double wait = retryAfterSeconds(messageChain(e));
            if (wait != null && wait <= MAX_RATE_LIMIT_WAIT_SECONDS) {
                log.info("Limite de tokens do Groq atingido, a aguardar {} s", Math.ceil(wait) + 1);
                try {
                    Thread.sleep((long) ((Math.ceil(wait) + 1) * 1000));
                    return chatLanguageModel.generate(prompt);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw toUserError(e);
                } catch (RuntimeException again) {
                    throw toUserError(again);
                }
            }
            throw toUserError(e);
        }
    }

    private ResponseStatusException toUserError(RuntimeException e) {
        String chain = messageChain(e);
        String msg = chain.toLowerCase();
        log.error("Erro do LLM: {}", chain);
        if (msg.contains("request too large") || msg.contains("413")) {
            return new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "O pedido ao Groq é maior do que o limite de tokens por minuto da conta. Reduz a descrição "
                            + "ou os orçamentos de prompt (app.kb/rules.prompt-budget-chars).");
        }
        if (msg.contains("rate_limit") || msg.contains("rate limit") || msg.contains("429")) {
            return new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "O limite de tokens por minuto do Groq foi atingido. Aguarda cerca de um minuto e tenta novamente.");
        }
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                "O modelo de linguagem não respondeu. Tenta novamente.");
    }

    /** Parses Groq's "Please try again in 1m2.5s" / "in 15.21s"; null when the error is not a rate limit. */
    static Double retryAfterSeconds(String error) {
        if (error == null || !error.contains("rate_limit")) return null;
        Matcher m = RETRY_AFTER.matcher(error);
        if (!m.find()) return null;
        double minutes = m.group(1) != null ? Double.parseDouble(m.group(1)) : 0;
        return minutes * 60 + Double.parseDouble(m.group(2));
    }

    private static String messageChain(Throwable e) {
        StringBuilder sb = new StringBuilder();
        for (Throwable t = e; t != null && sb.length() < 2000; t = t.getCause()) {
            sb.append(t.getClass().getSimpleName()).append(": ").append(t.getMessage()).append(" | ");
        }
        return sb.toString();
    }

    private List<String> parseKeywords(String rawKeywords, int max) {
        return Arrays.stream(rawKeywords.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank() && s.length() <= 60)
                .distinct()
                .limit(max)
                .collect(Collectors.toList());
    }

    private LogAdviceResponse parseResponse(String raw, String query) {
        try {
            JsonObject obj = parseJsonObject(raw);
            List<LogSection> sections = parseLogSections(obj);
            if (sections != null && !sections.isEmpty()) {
                LogAdviceResponse response = new LogAdviceResponse();
                response.setLogStructure(sections);
                response.setSecurityGuidance(nonNull(extractStringField(obj, "securityGuidance")));
                response.setDataTypes(nonNull(extractStringField(obj, "dataTypes")));
                response.setStorageTips(nonNull(extractStringField(obj, "storageTips")));
                return response;
            }
        } catch (Exception e) {
            log.error("Erro ao parsear JSON do LLM para query '{}': {}", query, e.getMessage());
        }

        LogAdviceResponse fallback = new LogAdviceResponse();
        fallback.setLogStructure(List.of(new LogSection("General", raw)));
        fallback.setSecurityGuidance("");
        fallback.setDataTypes("");
        fallback.setStorageTips("Não foi possível gerar as dicas de armazenamento separadamente.");
        return fallback;
    }

    private JsonObject parseJsonObject(String raw) {
        String json = raw.trim()
                .replaceAll("(?s)```json\\s*", "")
                .replaceAll("(?s)```\\s*", "")
                .trim();
        int start = json.indexOf('{');
        int end = json.lastIndexOf('}');
        if (start != -1 && end != -1 && end > start) {
            json = json.substring(start, end + 1);
        }
        try {
            return JsonParser.parseString(json).getAsJsonObject();
        } catch (RuntimeException e) {
            // Models often put real line breaks/tabs inside string values, which is invalid JSON
            try {
                return JsonParser.parseString(escapeControlCharsInStrings(json)).getAsJsonObject();
            } catch (RuntimeException again) {
                log.warn("Resposta do LLM não é JSON válido ({}): {}", again.getMessage(),
                        raw.length() > 1500 ? raw.substring(0, 1500) + "…" : raw);
                throw again;
            }
        }
    }

    static String escapeControlCharsInStrings(String json) {
        StringBuilder sb = new StringBuilder(json.length() + 64);
        boolean inString = false;
        boolean escaped = false;
        for (char c : json.toCharArray()) {
            if (!inString) {
                if (c == '"') inString = true;
                sb.append(c);
            } else if (escaped) {
                escaped = false;
                sb.append(c);
            } else if (c == '\\') {
                escaped = true;
                sb.append(c);
            } else if (c == '"') {
                inString = false;
                sb.append(c);
            } else if (c == '\n') {
                sb.append("\\n");
            } else if (c == '\t') {
                sb.append("\\t");
            } else if (c != '\r') {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    private List<LogSection> parseLogSections(JsonObject obj) {
        if (!obj.has("logStructure")) return null;
        JsonElement el = obj.get("logStructure");
        List<LogSection> sections = new ArrayList<>();

        if (el.isJsonArray()) {
            for (JsonElement item : el.getAsJsonArray()) {
                if (item.isJsonObject()) {
                    JsonObject sectionObj = item.getAsJsonObject();
                    String technology = extractStringField(sectionObj, "technology");
                    String content = extractStringField(sectionObj, "content");
                    if (technology != null && content != null) {
                        sections.add(new LogSection(technology, content));
                    }
                }
            }
        } else {
            String content = el.isJsonPrimitive() ? el.getAsString() : gson.toJson(el);
            sections.add(new LogSection("General", content));
        }

        return sections.isEmpty() ? null : sections;
    }

    private String extractStringField(JsonObject obj, String field) {
        if (!obj.has(field) || obj.get(field).isJsonNull()) return null;
        JsonElement el = obj.get(field);
        return el.isJsonPrimitive() ? el.getAsString() : gson.toJson(el);
    }

    private String truncate(String text) {
        return text.length() <= MAX_SNIPPET_CHARS ? text : text.substring(0, MAX_SNIPPET_CHARS) + "…";
    }

    private static String clip(String query) {
        return query.length() <= MAX_DESCRIPTION_IN_PROMPT ? query : query.substring(0, MAX_DESCRIPTION_IN_PROMPT) + "…";
    }

    private static String bullets(List<String> lines) {
        return lines.stream().map(l -> "- " + l).collect(Collectors.joining("\n"));
    }

    private static int length(List<String> lines) {
        return lines.stream().mapToInt(l -> l.length() + 1).sum();
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private static String nonNull(String s) {
        return s == null ? "" : s;
    }
}
