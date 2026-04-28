package com.dissertacao.logadvisor.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ArticleResult {
    private String title;
    private String link;
    private String snippet;
    private String publication;
    private int year;
}
