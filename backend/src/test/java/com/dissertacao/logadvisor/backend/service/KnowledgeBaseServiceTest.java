package com.dissertacao.logadvisor.backend.service;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.dissertacao.logadvisor.backend.model.ArticleResult;

import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingSearchResult;
import dev.langchain4j.store.embedding.chroma.ChromaEmbeddingStore;

@ExtendWith(MockitoExtension.class)
class KnowledgeBaseServiceTest {

    @Mock
    private EmbeddingModel embeddingModel;

    @Mock
    private ChromaEmbeddingStore embeddingStore;

    @InjectMocks
    private KnowledgeBaseService knowledgeBaseService;

    private ArticleResult sampleArticle;

    @BeforeEach
    void setUp() {
        sampleArticle = new ArticleResult();
        sampleArticle.setTitle("Secure Logging Practices");
        sampleArticle.setLink("https://example.com/article");
        sampleArticle.setSnippet("Always sanitize log output to prevent injection attacks.");
        sampleArticle.setPublication("IEEE Security, 2023");
    }

    @Test
    void search_shouldEmbedQueryAndReturnMatches() {
        // TODO: mock embeddingModel.embed() to return a dummy Embedding
        // TODO: mock embeddingStore.search() to return an EmbeddingSearchResult with one match
        // TODO: call knowledgeBaseService.search("Java security logging", 5)
        // TODO: assert returned list has one element
        // TODO: verify embeddingModel.embed() was called once
    }

    @Test
    void search_whenStoreReturnsEmpty_shouldReturnEmptyList() {
        // TODO: mock embeddingModel.embed() to return a dummy Embedding
        // TODO: mock embeddingStore.search() to return an EmbeddingSearchResult with empty matches
        // TODO: assert returned list is empty
    }

    @Test
    void hasRelevantArticles_whenMatchesExist_shouldReturnTrue() {
        // TODO: mock search to return non-empty list (via embeddingModel + embeddingStore mocks)
        // TODO: assert knowledgeBaseService.hasRelevantArticles("security logging") is true
    }

    @Test
    void hasRelevantArticles_whenNoMatches_shouldReturnFalse() {
        // TODO: mock search to return empty list
        // TODO: assert knowledgeBaseService.hasRelevantArticles("unrelated topic") is false
    }

    @Test
    void saveArticles_shouldEmbedAndStoreEachArticle() {
        // TODO: mock embeddingModel.embed() to return a dummy Embedding
        // TODO: call knowledgeBaseService.saveArticles(List.of(sampleArticle, sampleArticle))
        // TODO: verify embeddingModel.embed() was called twice
        // TODO: verify embeddingStore.add() was called twice
    }

    @Test
    void saveArticles_withEmptyList_shouldNotCallStore() {
        // TODO: call knowledgeBaseService.saveArticles(List.of())
        // TODO: verify embeddingStore.add() was never called
    }

    @Test
    void saveArticles_shouldIncludeTitleLinkAndPublicationInMetadata() {
        // TODO: capture the TextSegment passed to embeddingStore.add()
        // TODO: assert segment.metadata().getString("title") equals sampleArticle.getTitle()
        // TODO: assert segment.metadata().getString("link") equals sampleArticle.getLink()
        // TODO: assert segment.metadata().getString("publication") equals sampleArticle.getPublication()
    }

    @Test
    void getAllArticles_whenCollectionNotFound_shouldReturnEmptyList() {
        // TODO: this method calls RestTemplate internally — consider using @SpringBootTest
        //       with a WireMock stub for the Chroma HTTP endpoint, or refactor to inject RestTemplate
        // TODO: stub Chroma GET /api/v1/collections/{name} to return null or 404
        // TODO: assert returned list is empty
    }

    @Test
    void getAllArticles_whenChromaReturnsDocuments_shouldMapToArticleResults() {
        // TODO: stub Chroma collection lookup to return a collection id
        // TODO: stub Chroma GET documents endpoint to return documents + metadatas arrays
        // TODO: assert returned list size matches number of documents
        // TODO: assert title/link/publication are mapped correctly from metadata
    }
}
