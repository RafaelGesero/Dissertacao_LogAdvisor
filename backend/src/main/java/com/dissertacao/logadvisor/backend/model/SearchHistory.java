package com.dissertacao.logadvisor.backend.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "search_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SearchHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String keywords;

    @Column(columnDefinition = "TEXT")
    private String query;

    private LocalDateTime createdAt;

    @Column(columnDefinition = "TEXT")
    private String logStructureJson;

    @Column(columnDefinition = "TEXT")
    private String storageTips;

    @Column(columnDefinition = "TEXT")
    private String sourcesJson;
}
