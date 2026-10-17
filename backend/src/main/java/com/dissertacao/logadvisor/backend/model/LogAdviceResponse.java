package com.dissertacao.logadvisor.backend.model;

import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LogAdviceResponse {
    private List<LogSection> logStructure;
    private String securityGuidance;
    private String dataTypes;
    private String storageTips;
    private List<ArticleResult> sources;
    private String keywords;
    private String mode;
    /** Articles fetched from Google Scholar and added to the KB by this search (mode KB_WITH_NEW). */
    private List<ArticleResult> newArticles = new ArrayList<>();
    private Long historyId;
    private boolean shared;
}
