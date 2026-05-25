package com.dissertacao.logadvisor.backend.controller;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.Mockito.when;

import com.dissertacao.logadvisor.backend.model.ArticleResult;
import com.dissertacao.logadvisor.backend.model.LogAdviceResponse;
import com.dissertacao.logadvisor.backend.model.LogSection;
import com.dissertacao.logadvisor.backend.service.KnowledgeBaseService;
import com.dissertacao.logadvisor.backend.service.LogAdvisorService;
import com.dissertacao.logadvisor.backend.service.SerpApiService;

@WebMvcTest(SearchController.class)
class SearchControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SerpApiService serpApiService;

    @MockitoBean
    private LogAdvisorService logAdvisorService;

    @MockitoBean
    private KnowledgeBaseService knowledgeBaseService;

    // --- GET /log/advice ---

    @Test
    void getAdvice_shouldReturn200WithLogAdviceResponse() throws Exception {
        // TODO: build a LogAdviceResponse with one LogSection and one ArticleResult
        // TODO: mock logAdvisorService.getLoggingAdvice("Java Spring") to return that response
        // TODO: perform GET /log/advice?query=Java+Spring
        // TODO: assert status 200
        // TODO: assert $.logStructure has size 1
        // TODO: assert $.logStructure[0].technology equals "Java"
        // TODO: assert $.storageTips is not empty
    }

    @Test
    void getAdvice_withMissingQueryParam_shouldReturn400() throws Exception {
        // TODO: perform GET /log/advice (no query param)
        // TODO: assert status 400
    }

    @Test
    void getAdvice_shouldDelegateQueryToLogAdvisorService() throws Exception {
        // TODO: mock logAdvisorService.getLoggingAdvice(anyString()) to return empty response
        // TODO: perform GET /log/advice?query=test
        // TODO: verify logAdvisorService.getLoggingAdvice("test") was called exactly once
    }

    // --- GET /log/searchArticles ---

    @Test
    void searchArticles_shouldReturn200WithArticleList() throws Exception {
        // TODO: build an ArticleResult with title, link, snippet, publication
        // TODO: mock serpApiService.searchArticles("security logging") to return List.of(article)
        // TODO: perform GET /log/searchArticles?query=security+logging
        // TODO: assert status 200
        // TODO: assert $.length() is 1
        // TODO: assert $[0].title equals expected title
    }

    @Test
    void searchArticles_whenNoResults_shouldReturnEmptyArray() throws Exception {
        // TODO: mock serpApiService.searchArticles(anyString()) to return List.of()
        // TODO: perform GET /log/searchArticles?query=nothing
        // TODO: assert status 200
        // TODO: assert response body is "[]"
    }

    @Test
    void searchArticles_withMissingQueryParam_shouldReturn400() throws Exception {
        // TODO: perform GET /log/searchArticles (no query param)
        // TODO: assert status 400
    }

    // --- GET /log/articlesKB ---

    @Test
    void getAllKnowledgeBaseArticles_shouldReturn200WithArticleList() throws Exception {
        // TODO: build an ArticleResult
        // TODO: mock knowledgeBaseService.getAllArticles() to return List.of(article)
        // TODO: perform GET /log/articlesKB
        // TODO: assert status 200
        // TODO: assert $.length() is 1
    }

    @Test
    void getAllKnowledgeBaseArticles_whenKBEmpty_shouldReturnEmptyArray() throws Exception {
        // TODO: mock knowledgeBaseService.getAllArticles() to return List.of()
        // TODO: perform GET /log/articlesKB
        // TODO: assert status 200
        // TODO: assert response body is "[]"
    }
}
