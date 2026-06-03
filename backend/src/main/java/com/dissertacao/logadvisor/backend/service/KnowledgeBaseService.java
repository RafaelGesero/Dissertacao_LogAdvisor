package com.dissertacao.logadvisor.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.dissertacao.logadvisor.backend.model.Article;
import com.dissertacao.logadvisor.backend.model.ArticleResult;
import com.dissertacao.logadvisor.backend.repository.ArticleRepository;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

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
    private final ArticleRepository articleRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${rag.min-score}")
    private double minScore;

    @Value("${chroma.url}")
    private String chromaUrl;

    @Value("${chroma.collection}")
    private String collectionName;

    // ── Vector search ────────────────────────────────────────────────────────

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

    // ── Save ─────────────────────────────────────────────────────────────────

    public void saveArticles(List<ArticleResult> articles) {
        int saved = 0;
        for (ArticleResult ar : articles) {
            try {
                // Upsert in PostgreSQL
                Article entity = articleRepository.findByLink(ar.getLink())
                        .orElseGet(() -> {
                            Article a = new Article();
                            a.setCreatedAt(LocalDateTime.now());
                            return a;
                        });
                entity.setLink(ar.getLink() != null ? ar.getLink() : "");
                entity.setTitle(ar.getTitle() != null ? ar.getTitle() : "");
                entity.setSnippet(ar.getSnippet() != null ? ar.getSnippet() : "");
                entity.setPublication(ar.getPublication() != null ? ar.getPublication() : "");
                entity.setTechnology(ar.getTechnology() != null ? ar.getTechnology() : "");
                Article saved_entity = articleRepository.save(entity);
                ar.setId(saved_entity.getId());

                // Embed + add to Chroma
                String content = buildContent(ar);
                Metadata metadata = Metadata.from("link", entity.getLink());
                metadata.put("title", entity.getTitle());
                metadata.put("publication", entity.getPublication());
                metadata.put("technology", entity.getTechnology());
                TextSegment segment = TextSegment.from(content, metadata);
                Embedding embedding = embeddingModel.embed(segment).content();
                embeddingStore.add(embedding, segment);
                saved++;
            } catch (Exception e) {
                log.error("Erro ao guardar artigo '{}': {}", ar.getTitle(), e.getMessage());
            }
        }
        log.info("saveArticles: {}/{} guardados", saved, articles.size());
    }

    // ── Read (PostgreSQL as source of truth) ─────────────────────────────────

    public List<ArticleResult> getAllArticles() {
        List<Article> entities = articleRepository.findAll(
                Sort.by(Sort.Direction.DESC, "createdAt"));
        log.info("Total de artigos na KB (PostgreSQL): {}", entities.size());
        return entities.stream().map(this::toArticleResult).toList();
    }

    // ── Delete individual ─────────────────────────────────────────────────────

    public void deleteArticle(Long id) {
        articleRepository.findById(id).ifPresentOrElse(article -> {
            deleteFromChromaByLink(article.getLink());
            articleRepository.deleteById(id);
            log.info("Artigo id={} ('{}') removido", id, article.getTitle());
        }, () -> log.warn("Artigo id={} não encontrado", id));
    }

    // ── Clear all ────────────────────────────────────────────────────────────

    public void clearAllArticles() {
        long count = articleRepository.count();
        articleRepository.deleteAll();
        clearChromaCollection();
        log.info("KB limpa: {} artigos removidos", count);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    public Article findOrSave(ArticleResult ar) {
        if (ar.getLink() == null || ar.getLink().isBlank()) return null;
        return articleRepository.findByLink(ar.getLink()).orElseGet(() -> {
            Article a = new Article();
            a.setLink(ar.getLink());
            a.setTitle(ar.getTitle() != null ? ar.getTitle() : "");
            a.setSnippet(ar.getSnippet() != null ? ar.getSnippet() : "");
            a.setPublication(ar.getPublication() != null ? ar.getPublication() : "");
            a.setTechnology(ar.getTechnology() != null ? ar.getTechnology() : "");
            a.setCreatedAt(LocalDateTime.now());
            return articleRepository.save(a);
        });
    }

    private ArticleResult toArticleResult(Article a) {
        ArticleResult ar = new ArticleResult();
        ar.setId(a.getId());
        ar.setTitle(a.getTitle());
        ar.setLink(a.getLink());
        ar.setSnippet(a.getSnippet());
        ar.setPublication(a.getPublication());
        ar.setTechnology(a.getTechnology());
        return ar;
    }

    private void deleteFromChromaByLink(String link) {
        try {
            String collectionId = fetchCollectionId();
            if (collectionId == null) return;
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            JsonObject eq = new JsonObject();
            eq.addProperty("$eq", link);
            JsonObject where = new JsonObject();
            where.add("link", eq);
            JsonObject body = new JsonObject();
            body.add("where", where);
            String deleteUrl = chromaUrl + "/api/v1/collections/" + collectionId + "/delete";
            restTemplate.postForEntity(deleteUrl, new HttpEntity<>(body.toString(), headers), String.class);
        } catch (Exception e) {
            log.error("Erro ao remover do Chroma (link={}): {}", link, e.getMessage());
        }
    }

    private void clearChromaCollection() {
        try {
            String collectionId = fetchCollectionId();
            if (collectionId == null) return;
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            String getUrl = chromaUrl + "/api/v1/collections/" + collectionId + "/get";
            String responseBody = restTemplate.postForObject(getUrl,
                    new HttpEntity<>("{\"include\":[],\"limit\":100000,\"offset\":0}", headers), String.class);
            if (responseBody == null) return;
            JsonObject resp = JsonParser.parseString(responseBody).getAsJsonObject();
            if (!resp.has("ids") || resp.get("ids").isJsonNull()) return;
            StringBuilder ids = new StringBuilder("[");
            resp.getAsJsonArray("ids").forEach(el -> {
                if (ids.length() > 1) ids.append(",");
                ids.append("\"").append(el.getAsString()).append("\"");
            });
            ids.append("]");
            if (ids.length() <= 2) return;
            String deleteUrl = chromaUrl + "/api/v1/collections/" + collectionId + "/delete";
            restTemplate.postForEntity(deleteUrl,
                    new HttpEntity<>("{\"ids\":" + ids + "}", headers), String.class);
        } catch (Exception e) {
            log.error("Erro ao limpar Chroma: {}", e.getMessage());
        }
    }

    private String fetchCollectionId() {
        try {
            String json = restTemplate.getForObject(
                    chromaUrl + "/api/v1/collections/" + collectionName, String.class);
            if (json == null) return null;
            JsonElement id = JsonParser.parseString(json).getAsJsonObject().get("id");
            return (id == null || id.isJsonNull()) ? null : id.getAsString();
        } catch (Exception e) {
            log.error("Erro ao obter collection '{}': {}", collectionName, e.getMessage());
            return null;
        }
    }

    private String buildContent(ArticleResult article) {
        return "Title: " + article.getTitle() + "\n"
             + "Snippet: " + article.getSnippet() + "\n"
             + "Publication: " + article.getPublication();
    }
}
