package com.dissertacao.logadvisor.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.dissertacao.logadvisor.backend.model.ArticleResult;
import com.dissertacao.logadvisor.backend.service.KnowledgeBaseService;
import com.dissertacao.logadvisor.backend.service.LogAdvisorService;
import com.dissertacao.logadvisor.backend.service.SerpApiService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SerpApiService serpApiService;
    private final LogAdvisorService logAdvisorService;
    private final KnowledgeBaseService knowledgeBaseService;

    @GetMapping("/articles")
    public ResponseEntity<List<ArticleResult>> searchArticles(@RequestParam String query) {
        return ResponseEntity.ok(serpApiService.searchArticles(query));
    }

    @GetMapping("/advice")
    public ResponseEntity<String> getAdvice(@RequestParam String query) {
        return ResponseEntity.ok(logAdvisorService.getLoggingAdvice(query));
    }

    @GetMapping("/knowledge-base")
    public ResponseEntity<List<ArticleResult>> getAllKnowledgeBaseArticles() {
        return ResponseEntity.ok(knowledgeBaseService.getAllArticles());
    }
}