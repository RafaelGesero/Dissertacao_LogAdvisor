package com.dissertacao.logadvisor.backend.service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.dissertacao.logadvisor.backend.model.ArticleResult;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class SerpApiService {

    private static final int RESULTS_PER_PAGE = 20;
    private static final int PAGES_TO_FETCH = 3;

    @Value("${serpapi.key}")
    private String apiKey;

    private final RestClient restClient = RestClient.create();

    public List<ArticleResult> searchArticles(String query) {
        List<ArticleResult> all = new ArrayList<>();
        for (int page = 0; page < PAGES_TO_FETCH; page++) {
            int start = page * RESULTS_PER_PAGE;
            List<ArticleResult> pageResults = fetchPage(query, start);
            all.addAll(pageResults);
            log.info("SerpAPI página {} (start={}): {} artigos para '{}'", page + 1, start, pageResults.size(), query);
            if (pageResults.isEmpty()) break;
        }
        log.info("SerpAPI total: {} artigos para '{}'", all.size(), query);
        return all;
    }

    private List<ArticleResult> fetchPage(String query, int start) {
        String url = "https://serpapi.com/search.json"
                + "?engine=google_scholar"
                + "&q=" + URLEncoder.encode(query, StandardCharsets.UTF_8)
                + "&api_key=" + apiKey
                + "&num=" + RESULTS_PER_PAGE
                + "&start=" + start;
        try {
            String response = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(String.class);
            return parseResults(response);
        } catch (Exception e) {
            log.warn("SerpAPI falhou para start={}: {}", start, e.getMessage());
            return List.of();
        }
    }

    private List<ArticleResult> parseResults(String json) {
        List<ArticleResult> results = new ArrayList<>();
        JsonObject root = JsonParser.parseString(json).getAsJsonObject();
        JsonArray articles = root.getAsJsonArray("organic_results");

        if (articles == null) return results;

        for (JsonElement el : articles) {
            JsonObject obj = el.getAsJsonObject();
            ArticleResult article = new ArticleResult();
            article.setTitle(getText(obj, "title"));
            article.setLink(getText(obj, "link"));
            article.setSnippet(getText(obj, "snippet"));

            if (obj.has("publication_info")) {
                article.setPublication(getText(
                    obj.getAsJsonObject("publication_info"), "summary"
                ));
            }
            results.add(article);
        }
        return results;
    }

    private String getText(JsonObject obj, String key) {
        return obj.has(key) ? obj.get(key).getAsString() : "";
    }
}
