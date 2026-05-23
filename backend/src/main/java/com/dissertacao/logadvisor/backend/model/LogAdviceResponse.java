package com.dissertacao.logadvisor.backend.model;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LogAdviceResponse {
    private String logStructure;
    private String storageTips;
    private List<ArticleResult> sources;
    private String keywords;
}
