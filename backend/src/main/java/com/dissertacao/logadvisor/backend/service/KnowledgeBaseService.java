package com.dissertacao.logadvisor.backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.dissertacao.logadvisor.backend.model.ArticleResult;

import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.chroma.ChromaEmbeddingStore;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class KnowledgeBaseService {

    private final EmbeddingModel embeddingModel;
    private final ChromaEmbeddingStore embeddingStore;

    @Value("${rag.min-score}")
    private double minScore;

    // Pesquisa artigos relevantes na base de conhecimento
    public List<EmbeddingMatch<TextSegment>> search(String query, int maxResults) {
        Embedding queryEmbedding = embeddingModel.embed(query).content();

        EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
                .queryEmbedding(queryEmbedding)
                .maxResults(maxResults)
                .minScore(minScore)
                .build();

        return embeddingStore.search(request).matches();
    }

    // Verifica se já existem artigos relevantes
    public boolean hasRelevantArticles(String query) {
        return !search(query, 3).isEmpty();
    }

    // Guarda artigos novos na base de conhecimento
    public void saveArticles(List<ArticleResult> articles) {
        for (ArticleResult article : articles) {
            // Evita duplicados verificando pelo link
            String content = buildContent(article);
            Metadata metadata = Metadata.from("link", article.getLink());
            metadata.put("title", article.getTitle());
            metadata.put("publication", article.getPublication());

            TextSegment segment = TextSegment.from(content, metadata);
            Embedding embedding = embeddingModel.embed(segment).content();
            embeddingStore.add(embedding, segment);
        }
    }

    private String buildContent(ArticleResult article) {
        return "Title: " + article.getTitle() + "\n"
             + "Snippet: " + article.getSnippet() + "\n"
             + "Publication: " + article.getPublication();
    }
}