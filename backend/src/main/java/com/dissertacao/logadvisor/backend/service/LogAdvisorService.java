package com.dissertacao.logadvisor.backend.service;

import java.util.ArrayList;
import java.util.List;
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

    private final KnowledgeBaseService knowledgeBaseService;
    private final SerpApiService serpApiService;
    private final ChatLanguageModel chatLanguageModel;
    private final Gson gson = new Gson();

    public LogAdviceResponse getLoggingAdvice(String query) {
        String keywords = extractSearchKeywords(query);
        log.info("Keywords extraídos para pesquisa: {}", keywords);

        List<EmbeddingMatch<TextSegment>> matches = knowledgeBaseService.search(keywords, 5);
        String articlesString;
        List<ArticleResult> sources;

        if (!matches.isEmpty()) {
            log.info("Encontrados {} artigos na base de conhecimento", matches.size());
            sources = matches.stream()
                    .map(match -> {
                        var meta = match.embedded().metadata();
                        ArticleResult ar = new ArticleResult();
                        ar.setTitle(meta.getString("title"));
                        ar.setLink(meta.getString("link"));
                        ar.setPublication(meta.getString("publication"));
                        return ar;
                    })
                    .collect(Collectors.toList());
            articlesString = matches.stream()
                    .map(match -> match.embedded().text())
                    .filter(text -> text != null && !text.isBlank())
                    .collect(Collectors.joining("\n\n---\n\n"));
        } else {
            log.info("Nenhum artigo na base, a pesquisar via SerpAPI...");
            List<ArticleResult> articles = serpApiService.searchArticles(keywords);

            if (!articles.isEmpty()) {
                knowledgeBaseService.saveArticles(articles);
                log.info("Guardados {} artigos na base de conhecimento", articles.size());
            }

            sources = articles;
            articlesString = articles.stream()
                    .map(a -> "Title: " + a.getTitle() + "\nSnippet: " + a.getSnippet())
                    .filter(text -> text != null && !text.isBlank())
                    .collect(Collectors.joining("\n\n---\n\n"));
        }

        if (articlesString.isBlank()) {
            articlesString = "No articles found. Use general knowledge about secure logging.";
            sources = List.of();
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
                  Mandatory Fields: <comma-separated list of required log fields>\\n\
                  Log Levels:\\n- INFO: <when to use INFO>\\n- WARN: <when to use WARN>\\n- ERROR: <when to use ERROR>\\n\
                  Security Events: <comma-separated list of security-specific events to log>\\n\
                  Example:\\n<compact single-line JSON log entry for this technology>\
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
        response.setSources(sources);
        response.setKeywords(keywords);
        return response;
    }

    private String extractSearchKeywords(String query) {
        String keywordPrompt = """
                Extract 3 to 5 concise technical keywords (languages, frameworks, databases, protocols) \
                from the following application description.
                Reply ONLY with the keywords separated by spaces, nothing else. No punctuation, no explanations.

                Description: %s
                """.formatted(query);
        try {
            String extracted = chatLanguageModel.generate(keywordPrompt).trim();
            return extracted + " " + MANDATORY_SEARCH_TERMS;
        } catch (Exception e) {
            log.warn("Falha ao extrair keywords, usando query original: {}", e.getMessage());
            return query + " " + MANDATORY_SEARCH_TERMS;
        }
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
            // LLM returned a string instead of array — wrap in a single general section
            String content = el.isJsonPrimitive() ? el.getAsString() : gson.toJson(el);
            sections.add(new LogSection("General", content));
        }

        return sections.isEmpty() ? null : sections;
    }

    private String extractStringField(JsonObject obj, String field) {
        if (!obj.has(field)) return null;
        JsonElement el = obj.get(field);
        return el.isJsonPrimitive() ? el.getAsString() : gson.toJson(el);
    }
}
