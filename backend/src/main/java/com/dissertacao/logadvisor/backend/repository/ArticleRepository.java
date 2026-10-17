package com.dissertacao.logadvisor.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.dissertacao.logadvisor.backend.model.Article;

public interface ArticleRepository extends JpaRepository<Article, Long> {
    Optional<Article> findByLink(String link);

    boolean existsByLink(String link);

    boolean existsByTitleIgnoreCase(String title);
}
