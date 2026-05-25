package com.dissertacao.logadvisor.backend.service;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.dissertacao.logadvisor.backend.model.ArticleResult;
import com.dissertacao.logadvisor.backend.model.LogAdviceResponse;
import com.dissertacao.logadvisor.backend.model.LogSection;
import com.google.gson.Gson;

import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;

@ExtendWith(MockitoExtension.class)
class LogAdvisorServiceTest {

    @Mock
    private KnowledgeBaseService knowledgeBaseService;

    @Mock
    private SerpApiService serpApiService;

    @Mock
    private ChatLanguageModel chatLanguageModel;

    @InjectMocks
    private LogAdvisorService logAdvisorService;

    private static final String VALID_JSON_RESPONSE = """
            {
              "logStructure": [
                {"technology": "Java", "content": "Log authentication events at INFO level."},
                {"technology": "SQL", "content": "Log all DDL statements at WARN level."}
              ],
              "storageTips": "Never log passwords or PII. Retain logs for 90 days."
            }
            """;

    @BeforeEach
    void setUp() {
        // shared setup before each test
    }

    @Test
    void getLoggingAdvice_whenKnowledgeBaseHasMatches_shouldUseKBAndReturnResponse() {
        // TODO: mock knowledgeBaseService.search() to return non-empty list
        // TODO: mock chatLanguageModel.generate() to return keywords then VALID_JSON_RESPONSE
        // TODO: call logAdvisorService.getLoggingAdvice("Java Spring Boot REST API")
        // TODO: assert response.getLogStructure() has 2 sections
        // TODO: assert response.getSources() is not empty
        // TODO: verify serpApiService.searchArticles() was never called
    }

    @Test
    void getLoggingAdvice_whenKBEmpty_shouldFallbackToSerpApiAndSaveArticles() {
        // TODO: mock knowledgeBaseService.search() to return empty list
        // TODO: mock serpApiService.searchArticles() to return list with one ArticleResult
        // TODO: mock chatLanguageModel.generate() to return keywords then VALID_JSON_RESPONSE
        // TODO: call logAdvisorService.getLoggingAdvice("React HTML frontend")
        // TODO: assert response is not null
        // TODO: verify knowledgeBaseService.saveArticles() was called once
    }

    @Test
    void getLoggingAdvice_whenBothKBAndSerpApiEmpty_shouldReturnResponseWithEmptySources() {
        // TODO: mock knowledgeBaseService.search() to return empty list
        // TODO: mock serpApiService.searchArticles() to return empty list
        // TODO: mock chatLanguageModel.generate() to return keywords then VALID_JSON_RESPONSE
        // TODO: call logAdvisorService.getLoggingAdvice("unknown tech")
        // TODO: assert response.getSources() is empty
    }

    @Test
    void getLoggingAdvice_shouldAlwaysAppendMandatorySecurityKeywords() {
        // TODO: mock knowledgeBaseService.search() to return empty list
        // TODO: mock serpApiService.searchArticles() to return empty list
        // TODO: capture the argument passed to serpApiService.searchArticles()
        // TODO: assert the captured keywords contain "security logging"
    }

    @Test
    void getLoggingAdvice_whenLLMReturnsInvalidJson_shouldReturnFallbackResponse() {
        // TODO: mock knowledgeBaseService.search() to return empty list
        // TODO: mock serpApiService.searchArticles() to return empty list
        // TODO: mock chatLanguageModel.generate() to return "not valid json at all"
        // TODO: assert response.getLogStructure() has exactly one section with technology "General"
    }

    @Test
    void getLoggingAdvice_whenLLMReturnsMarkdownWrappedJson_shouldParseCorrectly() {
        // TODO: wrap VALID_JSON_RESPONSE in ```json ... ``` markdown fences
        // TODO: mock chatLanguageModel to return that wrapped string
        // TODO: assert response still parses correctly into 2 LogSections
    }

    @Test
    void getLoggingAdvice_whenSectionHasNoRelevantContent_shouldReturnNoInfoMessage() {
        // TODO: build JSON response where one section content is the NO_INFO_MESSAGE constant
        // TODO: assert that section's content equals "Não foi encontrada informação relevante sobre o tema em questão"
    }

    @Test
    void getLoggingAdvice_keywordsFieldInResponseShouldMatchExtractedKeywords() {
        // TODO: mock the keyword extraction LLM call to return "Java Spring"
        // TODO: assert response.getKeywords() contains "Java Spring"
        // TODO: assert response.getKeywords() contains the mandatory security terms
    }
}
