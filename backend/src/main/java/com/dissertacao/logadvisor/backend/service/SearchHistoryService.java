package com.dissertacao.logadvisor.backend.service;

import java.lang.reflect.Type;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.dissertacao.logadvisor.backend.model.Article;
import com.dissertacao.logadvisor.backend.model.ArticleResult;
import com.dissertacao.logadvisor.backend.model.HistoryEntry;
import com.dissertacao.logadvisor.backend.model.LogAdviceResponse;
import com.dissertacao.logadvisor.backend.model.LogSection;
import com.dissertacao.logadvisor.backend.model.SearchHistory;
import com.dissertacao.logadvisor.backend.model.SearchMode;
import com.dissertacao.logadvisor.backend.model.User;
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

    /** Stores the analysis for {@code user} (private by default) and returns the new history id. */
    public Long save(User user, String query, LogAdviceResponse response) {
        boolean fromRulesFile = SearchMode.RULES.name().equals(response.getMode());

        SearchHistory entry = new SearchHistory();
        entry.setUser(user);
        entry.setShared(false);
        entry.setMode(response.getMode());
        entry.setKeywords(response.getKeywords());
        entry.setQuery(query);
        entry.setCreatedAt(LocalDateTime.now());
        entry.setLogStructureJson(gson.toJson(response.getLogStructure()));
        entry.setSecurityGuidance(response.getSecurityGuidance());
        entry.setDataTypes(response.getDataTypes());
        entry.setStorageTips(response.getStorageTips());
        entry.setSourcesJson(gson.toJson(response.getSources()));
        if (!fromRulesFile) {
            // KB sources are resolved by id, so edits/deletions in the KB are reflected in old analyses.
            // Rules-file sources are bibliography entries, not KB articles, and stay as a JSON snapshot.
            entry.setArticleIdsJson(gson.toJson(resolveIds(response.getSources())));
        }
        entry.setNewArticleIdsJson(gson.toJson(resolveIds(response.getNewArticles())));
        return repository.save(entry).getId();
    }

    public List<HistoryEntry> getForUser(User user) {
        return toEntries(repository.findAllByUserIdOrderByCreatedAtDesc(user.getId()));
    }

    public List<HistoryEntry> getShared() {
        return toEntries(repository.findAllBySharedTrueOrderByCreatedAtDesc());
    }

    public List<HistoryEntry> getAll() {
        return toEntries(repository.findAllByOrderByCreatedAtDesc());
    }

    public HistoryEntry setShared(User user, Long id, boolean shared) {
        SearchHistory entry = findOwned(user, id);
        entry.setShared(shared);
        return toEntry(repository.save(entry));
    }

    public void deleteById(User user, Long id) {
        repository.delete(findOwned(user, id));
    }

    /** The owner can change/delete an analysis; the admin can do it for any analysis. */
    private SearchHistory findOwned(User user, Long id) {
        SearchHistory entry = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Análise não encontrada."));
        boolean isOwner = entry.getUser() != null && entry.getUser().getId().equals(user.getId());
        if (!isOwner && !user.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Esta análise pertence a outro utilizador.");
        }
        return entry;
    }

    private List<Long> resolveIds(List<ArticleResult> articles) {
        List<Long> ids = new ArrayList<>();
        if (articles == null) return ids;
        for (ArticleResult ar : articles) {
            Article article = knowledgeBaseService.findOrSave(ar);
            if (article != null) ids.add(article.getId());
        }
        return ids;
    }

    private List<HistoryEntry> toEntries(List<SearchHistory> rows) {
        return rows.stream().map(this::toEntry).collect(Collectors.toList());
    }

    private HistoryEntry toEntry(SearchHistory h) {
        List<LogSection> logStructure = gson.fromJson(h.getLogStructureJson(), LOG_SECTIONS_TYPE);

        List<ArticleResult> sources;
        if (h.getArticleIdsJson() != null && !h.getArticleIdsJson().isBlank()) {
            // KB format: resolve IDs against current articles table
            sources = loadArticles(h.getArticleIdsJson());
        } else {
            // Rules file and backward compat: use JSON snapshot
            sources = h.getSourcesJson() != null
                    ? gson.fromJson(h.getSourcesJson(), SOURCES_TYPE)
                    : List.of();
        }

        return HistoryEntry.builder()
                .id(h.getId())
                .keywords(h.getKeywords())
                .query(h.getQuery())
                .createdAt(h.getCreatedAt().format(FORMATTER))
                .mode(h.getMode() != null ? h.getMode() : SearchMode.KB_WITH_NEW.name())
                .shared(h.isShared())
                .owner(h.getUser() != null ? h.getUser().getEmail() : null)
                .logStructure(logStructure)
                .securityGuidance(h.getSecurityGuidance())
                .dataTypes(h.getDataTypes())
                .storageTips(h.getStorageTips())
                .sources(sources)
                .newArticles(h.getNewArticleIdsJson() != null ? loadArticles(h.getNewArticleIdsJson()) : List.of())
                .build();
    }

    private List<ArticleResult> loadArticles(String idsJson) {
        List<Long> ids = gson.fromJson(idsJson, ID_LIST_TYPE);
        if (ids == null || ids.isEmpty()) return List.of();
        return articleRepository.findAllById(ids)
                .stream()
                .map(this::toArticleResult)
                .collect(Collectors.toList());
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
