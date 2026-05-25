package com.dissertacao.logadvisor.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.dissertacao.logadvisor.backend.model.SearchHistory;

public interface SearchHistoryRepository extends JpaRepository<SearchHistory, Long> {
    List<SearchHistory> findAllByOrderByCreatedAtDesc();
}
