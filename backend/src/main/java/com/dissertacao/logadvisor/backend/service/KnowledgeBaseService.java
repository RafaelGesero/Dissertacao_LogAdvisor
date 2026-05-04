package com.dissertacao.logadvisor.backend.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.dissertacao.logadvisor.backend.model.ArticleResult;

import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.chroma.ChromaEmbeddingStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class KnowledgeBaseService {

    private final EmbeddingModel embeddingModel;
    private final ChromaEmbeddingStore embeddingStore;

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${rag.min-score}")
    private double minScore;

    @Value("${chroma.url}")
    private String chromaUrl;

    @Value("${chroma.collection}")
    private String collectionName;

    public List<EmbeddingMatch<TextSegment>> search(String query, int maxResults) {
        Embedding queryEmbedding = embeddingModel.embed(query).content();

        EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
                .queryEmbedding(queryEmbedding)
                .maxResults(maxResults)
                .minScore(minScore)
                .build();

        return embeddingStore.search(request).matches();
    }

    public boolean hasRelevantArticles(String query) {
        return !search(query, 3).isEmpty();
    }

    public void saveArticles(List<ArticleResult> articles) {
        for (ArticleResult article : articles) {
            String content = buildContent(article);
            Metadata metadata = Metadata.from("link", article.getLink());
            metadata.put("title", article.getTitle());
            metadata.put("publication", article.getPublication());

            TextSegment segment = TextSegment.from(content, metadata);
            Embedding embedding = embeddingModel.embed(segment).content();
            embeddingStore.add(embedding, segment);
        }
    }

    @SuppressWarnings("unchecked")
    public List<ArticleResult> getAllArticles() {
        String collectionUrl = chromaUrl + "/api/v1/collections/" + collectionName;
        Map<String, Object> collection = restTemplate.getForObject(collectionUrl, Map.class);

        if (collection == null || !collection.containsKey("id")) {
            log.warn("Collection '{}' não encontrada no Chroma", collectionName);
            return List.of();
        }

        String collectionId = (String) collection.get("id");
        log.info("Collection '{}' encontrada com id={}", collectionName, collectionId);

        String getUrl = chromaUrl + "/api/v1/collections/" + collectionId + "/get";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "include", List.of("documents", "metadatas"),
                "limit", 10000,
                "offset", 0);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        Map<String, Object> response = restTemplate.postForObject(getUrl, entity, Map.class);

        if (response == null) {
            return List.of();
        }

        List<String> documents = (List<String>) response.get("documents");
        List<Map<String, Object>> metadatas = (List<Map<String, Object>>) response.get("metadatas");

        if (documents == null || documents.isEmpty()) {
            log.info("Nenhum artigo encontrado na base de conhecimento");
            return List.of();
        }

        List<ArticleResult> articles = new ArrayList<>();
        for (int i = 0; i < documents.size(); i++) {
            Map<String, Object> meta = (metadatas != null && i < metadatas.size())
                    ? metadatas.get(i)
                    : Map.of();

            ArticleResult article = new ArticleResult();
            article.setTitle((String) meta.getOrDefault("title", "Sem título"));
            article.setLink((String) meta.getOrDefault("link", ""));
            article.setPublication((String) meta.getOrDefault("publication", ""));
            article.setSnippet(documents.get(i));
            articles.add(article);
        }

        log.info("Total de artigos na base de conhecimento: {}", articles.size());
        return articles;
    }

    private String buildContent(ArticleResult article) {
        return "Title: " + article.getTitle() + "\n"
             + "Snippet: " + article.getSnippet() + "\n"
             + "Publication: " + article.getPublication();
    }
}
