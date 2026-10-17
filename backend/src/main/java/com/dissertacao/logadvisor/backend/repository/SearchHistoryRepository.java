package com.dissertacao.logadvisor.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.dissertacao.logadvisor.backend.model.SearchHistory;
import com.dissertacao.logadvisor.backend.model.User;

public interface SearchHistoryRepository extends JpaRepository<SearchHistory, Long> {
    List<SearchHistory> findAllByOrderByCreatedAtDesc();

    List<SearchHistory> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    List<SearchHistory> findAllBySharedTrueOrderByCreatedAtDesc();

    long countByUserId(Long userId);

    @Modifying
    @Query("update SearchHistory h set h.user = :user where h.user is null")
    int assignOrphansTo(@Param("user") User user);
}
