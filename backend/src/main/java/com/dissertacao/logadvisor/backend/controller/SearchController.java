package com.dissertacao.logadvisor.backend.controller;

import com.dissertacao.logadvisor.backend.model.ArticleResult;
import com.dissertacao.logadvisor.backend.service.SerpApiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SerpApiService serpApiService;

    @GetMapping("/articles")
    public ResponseEntity<List<ArticleResult>> searchArticles(
            @RequestParam String query) {
        List<ArticleResult> results = serpApiService.searchArticles(query);
        return ResponseEntity.ok(results);
    }
}
