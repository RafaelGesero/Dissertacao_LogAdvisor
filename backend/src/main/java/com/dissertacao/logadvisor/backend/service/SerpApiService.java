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

@Service
public class SerpApiService {

    @Value("${serpapi.key}")
    private String apiKey;

    private final RestClient restClient = RestClient.create();

    //ALterar o numero de artigos pesquisados &num=20 é o maximo por paginação, para conseguir fazer mais é necessario acrescentar %start=
    //em principio nao é necessário, 20 deve chegar
    public List<ArticleResult> searchArticles(String query) {
        String url = "https://serpapi.com/search.json"
                + "?engine=google_scholar"
                + "&q=" + URLEncoder.encode(query, StandardCharsets.UTF_8)
                + "&api_key=" + apiKey
                + "&num=20";

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
