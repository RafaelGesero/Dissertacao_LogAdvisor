package com.dissertacao.logadvisor.backend.model;

/** The three ways LoggingAdvisor can build a recommendation. */
public enum SearchMode {
    /** 1.1 — the curated rules file built from the dissertation bibliography. */
    RULES,
    /** 1.2 — only the articles already stored in the knowledge base. */
    KB,
    /** 1.3 — fetch up to 5 new articles per technology, add them to the KB, then use the whole KB. */
    KB_WITH_NEW;

    public static SearchMode parse(String value) {
        if (value == null || value.isBlank()) return KB;
        try {
            return SearchMode.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return KB;
        }
    }
}
