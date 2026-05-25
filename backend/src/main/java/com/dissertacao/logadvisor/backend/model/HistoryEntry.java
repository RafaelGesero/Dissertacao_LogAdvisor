package com.dissertacao.logadvisor.backend.model;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HistoryEntry {
    private Long id;
    private String keywords;
    private String query;
    private String createdAt;
    private List<LogSection> logStructure;
    private String storageTips;
    private List<ArticleResult> sources;
}
