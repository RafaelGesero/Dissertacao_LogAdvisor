package com.dissertacao.logadvisor.backend.controller;

import com.dissertacao.logadvisor.backend.config.Messages;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.dissertacao.logadvisor.backend.model.AdviceRequest;
import com.dissertacao.logadvisor.backend.model.ArticleResult;
import com.dissertacao.logadvisor.backend.model.HistoryEntry;
import com.dissertacao.logadvisor.backend.model.LogAdviceResponse;
import com.dissertacao.logadvisor.backend.model.SearchMode;
import com.dissertacao.logadvisor.backend.model.ShareRequest;
import com.dissertacao.logadvisor.backend.model.User;
import com.dissertacao.logadvisor.backend.service.KnowledgeBaseService;
import com.dissertacao.logadvisor.backend.service.LogAdvisorService;
import com.dissertacao.logadvisor.backend.service.SearchHistoryService;
import com.dissertacao.logadvisor.backend.service.SerpApiService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/log")
@RequiredArgsConstructor
public class SearchController {

    private static final int MAX_QUERY_CHARS = 5000;

    private final SerpApiService serpApiService;
    private final LogAdvisorService logAdvisorService;
    private final KnowledgeBaseService knowledgeBaseService;
    private final SearchHistoryService searchHistoryService;

    @GetMapping("/searchArticles")
    public ResponseEntity<List<ArticleResult>> searchArticles(@RequestParam String query) {
        return ResponseEntity.ok(serpApiService.searchArticles(query));
    }

    @PostMapping("/advice")
    public ResponseEntity<LogAdviceResponse> getAdvice(@AuthenticationPrincipal User user,
                                                       @RequestBody AdviceRequest request) {
        String query = request.getQuery() == null ? "" : request.getQuery().trim();
        if (query.isEmpty() || query.length() > MAX_QUERY_CHARS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    Messages.t("advice.description.length", MAX_QUERY_CHARS));
        }
        LogAdviceResponse response = logAdvisorService.getLoggingAdvice(query, SearchMode.parse(request.getMode()));
        response.setHistoryId(searchHistoryService.save(user, query, response));
        response.setShared(false);
        return ResponseEntity.ok(response);
    }

    /** The current user's own analyses. */
    @GetMapping("/history")
    public ResponseEntity<List<HistoryEntry>> getHistory(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(searchHistoryService.getForUser(user));
    }

    @PutMapping("/history/{id}/share")
    public ResponseEntity<HistoryEntry> share(@AuthenticationPrincipal User user, @PathVariable Long id,
                                              @RequestBody ShareRequest request) {
        return ResponseEntity.ok(searchHistoryService.setShared(user, id, request.isShared()));
    }

    @DeleteMapping("/history/{id}")
    public ResponseEntity<Void> deleteHistory(@AuthenticationPrincipal User user, @PathVariable Long id) {
        searchHistoryService.deleteById(user, id);
        return ResponseEntity.ok().build();
    }

    /** Analyses that their owners chose to share with every user. */
    @GetMapping("/shared")
    public ResponseEntity<List<HistoryEntry>> getShared() {
        return ResponseEntity.ok(searchHistoryService.getShared());
    }

    @GetMapping("/articlesKB")
    public ResponseEntity<List<ArticleResult>> getAllKnowledgeBaseArticles() {
        return ResponseEntity.ok(knowledgeBaseService.getAllArticles());
    }

    @PostMapping("/articlesKB")
    public ResponseEntity<Void> addArticle(@RequestBody ArticleResult article) {
        knowledgeBaseService.saveArticles(List.of(article));
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/articlesKB/{id}")
    public ResponseEntity<Void> deleteArticle(@PathVariable Long id) {
        knowledgeBaseService.deleteArticle(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/articlesKB")
    public ResponseEntity<Void> clearKnowledgeBase() {
        knowledgeBaseService.clearAllArticles();
        return ResponseEntity.ok().build();
    }
}
