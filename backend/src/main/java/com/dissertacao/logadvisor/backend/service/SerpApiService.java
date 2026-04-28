package com.dissertacao.logadvisor.backend.service;

import com.dissertacao.logadvisor.backend.model.ArticleResult;
import com.google.gson.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class SerpApiService {

    @Value("${serpapi.key}")
    private String apiKey;

    private final RestClient restClient = RestClient.create();

    public List<ArticleResult> searchArticles(String query) {
        String url = "https://serpapi.com/search.json"
                + "?engine=google_scholar"
                + "&q=" + URLEncoder.encode(query, StandardCharsets.UTF_8)
                + "&api_key=" + apiKey
                + "&num=10";

        String response = restClient.get()
                .uri(url)
                .retrieve()
                .body(String.class);

        return parseResults(response);
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
