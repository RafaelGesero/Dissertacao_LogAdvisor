package com.dissertacao.logadvisor.backend.model;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoryEntry {
    private Long id;
    private String keywords;
    private String query;
    private String createdAt;
    private String mode;
    private boolean shared;
    private String owner;
    private List<LogSection> logStructure;
    private String securityGuidance;
    private String dataTypes;
    private String storageTips;
    private List<ArticleResult> sources;
    private List<ArticleResult> newArticles;
}
