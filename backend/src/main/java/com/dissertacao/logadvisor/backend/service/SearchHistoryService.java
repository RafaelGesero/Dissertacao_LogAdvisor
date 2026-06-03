package com.dissertacao.logadvisor.backend.service;

import java.lang.reflect.Type;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.dissertacao.logadvisor.backend.model.Article;
import com.dissertacao.logadvisor.backend.model.ArticleResult;
import com.dissertacao.logadvisor.backend.model.HistoryEntry;
import com.dissertacao.logadvisor.backend.model.LogAdviceResponse;
import com.dissertacao.logadvisor.backend.model.LogSection;
import com.dissertacao.logadvisor.backend.model.SearchHistory;
import com.dissertacao.logadvisor.backend.repository.ArticleRepository;
import com.dissertacao.logadvisor.backend.repository.SearchHistoryRepository;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SearchHistoryService {

    private final SearchHistoryRepository repository;
    private final ArticleRepository articleRepository;
    private final KnowledgeBaseService knowledgeBaseService;
    private final Gson gson = new Gson();

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("d MMM yyyy, HH:mm");

    private static final Type LOG_SECTIONS_TYPE =
            new TypeToken<List<LogSection>>() {}.getType();

    private static final Type SOURCES_TYPE =
            new TypeToken<List<ArticleResult>>() {}.getType();

    private static final Type ID_LIST_TYPE =
            new TypeToken<List<Long>>() {}.getType();

    public void save(String query, LogAdviceResponse response) {
        // Resolve article IDs — find in DB or save if missing
        List<Long> articleIds = new ArrayList<>();
        if (response.getSources() != null) {
            for (ArticleResult ar : response.getSources()) {
                Article article = knowledgeBaseService.findOrSave(ar);
                if (article != null) articleIds.add(article.getId());
            }
        }

        SearchHistory entry = new SearchHistory();
        entry.setKeywords(response.getKeywords());
        entry.setQuery(query);
        entry.setCreatedAt(LocalDateTime.now());
        entry.setLogStructureJson(gson.toJson(response.getLogStructure()));
        entry.setStorageTips(response.getStorageTips());
        entry.setSourcesJson(gson.toJson(response.getSources())); // kept for backward compat
        entry.setArticleIdsJson(gson.toJson(articleIds));
        repository.save(entry);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }

    public List<HistoryEntry> getAll() {
        return repository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toEntry)
                .collect(Collectors.toList());
    }

    private HistoryEntry toEntry(SearchHistory h) {
        List<LogSection> logStructure = gson.fromJson(h.getLogStructureJson(), LOG_SECTIONS_TYPE);
        String storageTips = h.getStorageTips();

        List<ArticleResult> sources;
        if (h.getArticleIdsJson() != null && !h.getArticleIdsJson().isBlank()) {
            // New format: resolve IDs against current articles table
            List<Long> ids = gson.fromJson(h.getArticleIdsJson(), ID_LIST_TYPE);
            sources = articleRepository.findAllById(ids)
                    .stream()
                    .map(this::toArticleResult)
                    .collect(Collectors.toList());
        } else {
            // Backward compat: use JSON snapshot
            sources = h.getSourcesJson() != null
                    ? gson.fromJson(h.getSourcesJson(), SOURCES_TYPE)
                    : List.of();
        }

        return new HistoryEntry(
                h.getId(), h.getKeywords(), h.getQuery(),
                h.getCreatedAt().format(FORMATTER),
                logStructure, storageTips, sources);
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
}
