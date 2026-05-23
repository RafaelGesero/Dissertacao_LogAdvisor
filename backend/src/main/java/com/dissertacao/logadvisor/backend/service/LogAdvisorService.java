package com.dissertacao.logadvisor.backend.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.dissertacao.logadvisor.backend.model.ArticleResult;
import com.dissertacao.logadvisor.backend.model.LogAdviceResponse;
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

    private final KnowledgeBaseService knowledgeBaseService;
    private final SerpApiService serpApiService;
    private final ChatLanguageModel chatLanguageModel;
    private final Gson gson = new Gson();

    public LogAdviceResponse getLoggingAdvice(String query) {
        String searchQuery = extractSearchKeywords(query);
        log.info("Keywords extraídos para pesquisa: {}", searchQuery);

        List<EmbeddingMatch<TextSegment>> matches = knowledgeBaseService.search(searchQuery, 5);
        String articlesString;

        if (!matches.isEmpty()) {
            log.info("Encontrados {} artigos na base de conhecimento", matches.size());
            articlesString = matches.stream()
                    .map(match -> match.embedded().text())
                    .filter(text -> text != null && !text.isBlank())
                    .collect(Collectors.joining("\n\n---\n\n"));
        } else {
            log.info("Nenhum artigo na base, a pesquisar via SerpAPI...");
            List<ArticleResult> articles = serpApiService.searchArticles(searchQuery);

            if (!articles.isEmpty()) {
                knowledgeBaseService.saveArticles(articles);
                log.info("Guardados {} artigos na base de conhecimento", articles.size());
            }

            articlesString = articles.stream()
                    .map(a -> "Title: " + a.getTitle() + "\nSnippet: " + a.getSnippet())
                    .filter(text -> text != null && !text.isBlank())
                    .collect(Collectors.joining("\n\n---\n\n"));
        }

        if (articlesString.isBlank()) {
            articlesString = "Nenhum artigo encontrado. Usa o teu conhecimento geral sobre logging seguro.";
        }

        String prompt = """
                Reply ONLY with a valid JSON object. Do not include any text before or after it, no markdown, no explanations.
                The JSON must have exactly these two fields:

                {
                  "logStructure": "...",
                  "storageTips": "..."
                }

                Field definitions:

                IMPORTANT: both field values MUST be plain strings. Use \n for line breaks. \
                Do NOT use nested JSON objects or arrays as field values.

                "logStructure": Based EXCLUSIVELY on the academic articles below, define the concrete log structure \
                for the described application. Include:
                - Mandatory fields in each log entry (e.g. timestamp, level, userId, action, result, ip)
                - Log levels to use (INFO, WARN, ERROR) and when to apply each
                - Specific events that must be logged (e.g. login, access to sensitive data, errors)
                - A concrete example of a log entry in structured JSON format

                "storageTips": Tips on how to store these logs securely and in compliance with regulations. Include:
                - What must NEVER appear in logs (personal data, credentials, payment data, etc.)
                - GDPR compliance: data minimisation, anonymisation, right to erasure
                - Recommended retention periods for each log type presented in logStructure
                - Recommendations on encryption at rest and in transit, and access control for logs

                Academic articles:
                %s

                Application described by the user: %s
                """.formatted(articlesString, query);

        String raw = chatLanguageModel.generate(prompt);
        log.debug("Resposta raw do LLM: {}", raw);
        return parseResponse(raw, query);
    }

    private String extractSearchKeywords(String query) {
        String keywordPrompt = """
                Extract 3 to 5 concise search keywords from the following application description.
                These keywords will be used to search academic articles about secure logging practices.
                Reply ONLY with the keywords separated by spaces, nothing else. No punctuation, no explanations.

                Description: %s
                """.formatted(query);
        try {
            return chatLanguageModel.generate(keywordPrompt).trim();
        } catch (Exception e) {
            log.warn("Falha ao extrair keywords, usando query original: {}", e.getMessage());
            return query;
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
            String logStructure = extractStringField(obj, "logStructure");
            String storageTips = extractStringField(obj, "storageTips");
            if (logStructure != null) {
                LogAdviceResponse response = new LogAdviceResponse();
                response.setLogStructure(logStructure);
                response.setStorageTips(storageTips != null ? storageTips : "");
                return response;
            }
        } catch (Exception e) {
            log.error("Erro ao parsear JSON do LLM para query '{}': {}", query, e.getMessage());
        }

        LogAdviceResponse fallback = new LogAdviceResponse();
        fallback.setLogStructure(raw);
        fallback.setStorageTips("Não foi possível gerar as dicas de armazenamento separadamente.");
        return fallback;
    }

    private String extractStringField(JsonObject obj, String field) {
        if (!obj.has(field)) return null;
        JsonElement el = obj.get(field);
        // LLM sometimes returns nested objects instead of a plain string
        return el.isJsonPrimitive() ? el.getAsString() : gson.toJson(el);
    }
}
