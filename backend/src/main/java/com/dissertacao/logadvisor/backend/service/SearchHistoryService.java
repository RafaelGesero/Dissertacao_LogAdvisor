package com.dissertacao.logadvisor.backend.service;

import java.lang.reflect.Type;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.dissertacao.logadvisor.backend.model.ArticleResult;
import com.dissertacao.logadvisor.backend.model.HistoryEntry;
import com.dissertacao.logadvisor.backend.model.LogAdviceResponse;
import com.dissertacao.logadvisor.backend.model.LogSection;
import com.dissertacao.logadvisor.backend.model.SearchHistory;
import com.dissertacao.logadvisor.backend.repository.SearchHistoryRepository;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SearchHistoryService {

    private final SearchHistoryRepository repository;
    private final Gson gson = new Gson();

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("d MMM yyyy, HH:mm");

    private static final Type LOG_SECTIONS_TYPE =
            new TypeToken<List<LogSection>>() {}.getType();

    private static final Type SOURCES_TYPE =
            new TypeToken<List<ArticleResult>>() {}.getType();

    public void save(String query, LogAdviceResponse response) {
        SearchHistory entry = new SearchHistory();
        entry.setKeywords(response.getKeywords());
        entry.setQuery(query);
        entry.setCreatedAt(LocalDateTime.now());
        entry.setLogStructureJson(gson.toJson(response.getLogStructure()));
        entry.setStorageTips(response.getStorageTips());
        entry.setSourcesJson(gson.toJson(response.getSources()));
        repository.save(entry);
    }

    public List<HistoryEntry> getAll() {
        return repository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(h -> new HistoryEntry(
                        h.getId(),
                        h.getKeywords(),
                        h.getQuery(),
                        h.getCreatedAt().format(FORMATTER),
                        gson.fromJson(h.getLogStructureJson(), LOG_SECTIONS_TYPE),
                        h.getStorageTips(),
                        gson.fromJson(h.getSourcesJson(), SOURCES_TYPE)
                ))
                .collect(Collectors.toList());
    }
}
