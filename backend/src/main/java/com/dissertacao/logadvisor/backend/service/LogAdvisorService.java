package com.dissertacao.logadvisor.backend.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.dissertacao.logadvisor.backend.model.ArticleResult;
import com.dissertacao.logadvisor.backend.model.LogAdviceResponse;
import com.dissertacao.logadvisor.backend.model.LogSection;
import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class LogAdvisorService {

    private static final String MANDATORY_SEARCH_TERMS = "security logging data protection information security";
    private static final String NO_INFO_MESSAGE = "Não foi encontrada informação relevante sobre o tema em questão";
    private static final int MIN_KB_ARTICLES_PER_TECH = 10;
    private static final int MAX_KB_FETCH_PER_TECH = 100;
    private static final int MAX_PROMPT_ARTICLES_PER_TECH = 15;
    private static final int MAX_SNIPPET_CHARS = 350;

    private final KnowledgeBaseService knowledgeBaseService;
    private final SerpApiService serpApiService;
    private final ChatLanguageModel chatLanguageModel;
    private final Gson gson = new Gson();

    public LogAdviceResponse getLoggingAdvice(String query) {
        String rawKeywords = extractRawKeywords(query);
        List<String> technologies = parseTechnologies(rawKeywords);
        String fullKeywords = rawKeywords.replace(",", " ").trim() + " " + MANDATORY_SEARCH_TERMS;

        log.info("Tecnologias extraídas: {}", technologies);

        List<ArticleResult> allSources = new ArrayList<>();
        List<String> promptArticles = new ArrayList<>();
        Set<String> seenLinks = new HashSet<>();

        for (String tech : technologies) {
            String techQuery = tech + " " + MANDATORY_SEARCH_TERMS;
            List<EmbeddingMatch<TextSegment>> kbMatches =
                    knowledgeBaseService.search(techQuery, MAX_KB_FETCH_PER_TECH);

            if (kbMatches.size() >= MIN_KB_ARTICLES_PER_TECH) {
                log.info("KB: {} artigos para '{}' — suficiente, sem SerpAPI", kbMatches.size(), tech);
                int added = 0;
                for (EmbeddingMatch<TextSegment> match : kbMatches) {
                    var meta = match.embedded().metadata();
                    String link = meta.getString("link");
                    if (link != null && seenLinks.add(link)) {
                        ArticleResult ar = new ArticleResult();
                        ar.setTitle(meta.getString("title"));
                        ar.setLink(link);
                        ar.setPublication(meta.getString("publication"));
                        ar.setTechnology(tech);
                        allSources.add(ar);
                    }
                    if (added < MAX_PROMPT_ARTICLES_PER_TECH) {
                        String text = match.embedded().text();
                        if (text != null && !text.isBlank()) {
                            promptArticles.add(truncate(text));
                            added++;
                        }
                    }
                }
            } else {
                log.info("KB: {} artigos para '{}' (mínimo {}), a pesquisar SerpAPI...",
                        kbMatches.size(), tech, MIN_KB_ARTICLES_PER_TECH);
                List<ArticleResult> serpArticles = serpApiService.searchArticles(techQuery);
                if (!serpArticles.isEmpty()) {
                    serpArticles.forEach(a -> a.setTechnology(tech));
                    knowledgeBaseService.saveArticles(serpArticles);
                    log.info("Guardados {} artigos de '{}' na KB", serpArticles.size(), tech);
                }
                int added = 0;
                for (ArticleResult a : serpArticles) {
                    if (a.getLink() != null && seenLinks.add(a.getLink())) {
                        allSources.add(a);
                    }
                    if (added < MAX_PROMPT_ARTICLES_PER_TECH) {
                        String text = "Title: " + a.getTitle() + "\nSnippet: " + a.getSnippet();
                        if (!text.isBlank()) {
                            promptArticles.add(truncate(text));
                            added++;
                        }
                    }
                }
            }
        }

        String articlesString;
        if (promptArticles.isEmpty()) {
            articlesString = "No articles found. Use general knowledge about secure logging.";
            allSources.clear();
        } else {
            articlesString = String.join("\n\n---\n\n", promptArticles);
        }

        String prompt = """
                Reply ONLY with a valid JSON object. Do not include any text before or after it, no markdown, no explanations.
                The JSON must have exactly these two fields:

                {
                  "logStructure": [
                    {"technology": "TechName", "content": "..."},
                    ...
                  ],
                  "storageTips": "..."
                }

                IMPORTANT: "storageTips" and each "content" value MUST be plain strings. \
                Use \\n for line breaks inside strings. Do NOT use nested JSON objects inside field values.

                "logStructure": An ARRAY of sections, one per technology/language/framework/database \
                identified in the user's description. For each section:
                - "technology": the exact name of the technology (e.g. "Java", "Spring Boot", "SQL", "React", "HTML")
                - "content": A structured string with EXACTLY these 4 labeled sections in this order, \
                  using \\n for line breaks, based EXCLUSIVELY on the academic articles. \
                  Use this exact format (replace placeholders with real content):\
                  Mandatory Fields: <comma-separated list of required log fields, e.g.: timestamp, level, service, userId, event, outcome, ipAddress>\\n\
                  Log Levels:\\n- INFO: <when to use INFO — describe events>\\n- WARN: <when to use WARN — describe events>\\n- ERROR: <when to use ERROR — describe events>\\n\
                  Security Events: <comma-separated list of security-specific events to log, e.g.: AUTH_SUCCESS, AUTH_FAILURE, AUTHZ_DENIED, DATA_ACCESS, SUSPICIOUS_ACTIVITY>\\n\
                  Log Template:\\n\
                  Schema: <one JSON object showing ALL mandatory fields with descriptive placeholders like <ISO-8601>, <hashed-id>, <success|failure>>\\n\
                  <EVENT_NAME> (INFO): <concrete single-line JSON example for an INFO-level security event>\\n\
                  <EVENT_NAME> (WARN): <concrete single-line JSON example for a WARN-level security event>\\n\
                  <EVENT_NAME> (ERROR): <concrete single-line JSON example for an ERROR-level security event>\\n\
                  Provide 3 to 5 event examples covering different log levels and security event types. \
                  Each example must include all mandatory fields. Values must be realistic but anonymised (hash user IDs). \
                  If the academic articles contain NO relevant information for that specific technology, \
                  set content to exactly: "%s"

                "storageTips": Tips on how to store these logs securely and in compliance with regulations. Include:
                - What must NEVER appear in logs (personal data, credentials, payment data, etc.)
                - GDPR compliance: data minimisation, anonymisation, right to erasure
                - Recommended retention periods for each log type
                - Recommendations on encryption at rest and in transit, and access control for logs

                Academic articles:
                %s

                Application described by the user: %s
                """.formatted(NO_INFO_MESSAGE, articlesString, query);

        String raw = chatLanguageModel.generate(prompt);
        log.debug("Resposta raw do LLM: {}", raw);
        LogAdviceResponse response = parseResponse(raw, query);
        response.setSources(allSources);
        response.setKeywords(fullKeywords);
        return response;
    }

    private String extractRawKeywords(String query) {
        String keywordPrompt = """
                Extract 3 to 5 concise technical keywords (languages, frameworks, databases, protocols) \
                from the following application description.
                Reply ONLY with the keywords separated by commas, nothing else. No punctuation at the end, no explanations.

                Description: %s
                """.formatted(query);
        try {
            return chatLanguageModel.generate(keywordPrompt).trim()
                    .replaceAll("\\.$", "");
        } catch (Exception e) {
            log.warn("Falha ao extrair keywords, usando query original: {}", e.getMessage());
            return query;
        }
    }

    private List<String> parseTechnologies(String rawKeywords) {
        return Arrays.stream(rawKeywords.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .distinct()
                .collect(Collectors.toList());
    }

    private LogAdviceResponse parseResponse(String raw, String query) {
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
            JsonObject obj = JsonParser.parseString(json).getAsJsonObject();
            List<LogSection> sections = parseLogSections(obj);
            String storageTips = extractStringField(obj, "storageTips");
            if (sections != null && !sections.isEmpty()) {
                LogAdviceResponse response = new LogAdviceResponse();
                response.setLogStructure(sections);
                response.setStorageTips(storageTips != null ? storageTips : "");
                return response;
            }
        } catch (Exception e) {
            log.error("Erro ao parsear JSON do LLM para query '{}': {}", query, e.getMessage());
        }

        LogAdviceResponse fallback = new LogAdviceResponse();
        fallback.setLogStructure(List.of(new LogSection("General", raw)));
        fallback.setStorageTips("Não foi possível gerar as dicas de armazenamento separadamente.");
        return fallback;
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

    private String truncate(String text) {
        return text.length() <= MAX_SNIPPET_CHARS ? text : text.substring(0, MAX_SNIPPET_CHARS) + "…";
    }

    private String extractStringField(JsonObject obj, String field) {
        if (!obj.has(field)) return null;
        JsonElement el = obj.get(field);
        return el.isJsonPrimitive() ? el.getAsString() : gson.toJson(el);
    }
}
