package com.dissertacao.logadvisor.backend.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    /** Visible to every user on the shared analyses page. Nullable for rows created before sharing existed. */
    private Boolean shared;

    @Column(length = 20)
    private String mode;

    private String keywords;

    @Column(columnDefinition = "TEXT")
    private String query;

    private LocalDateTime createdAt;

    @Column(columnDefinition = "TEXT")
    private String logStructureJson;

    @Column(columnDefinition = "TEXT")
    private String securityGuidance;

    @Column(columnDefinition = "TEXT")
    private String dataTypes;

    @Column(columnDefinition = "TEXT")
    private String storageTips;

    @Column(columnDefinition = "TEXT")
    private String sourcesJson;

    @Column(columnDefinition = "TEXT")
    private String articleIdsJson;

    @Column(columnDefinition = "TEXT")
    private String newArticleIdsJson;

    public boolean isShared() {
        return Boolean.TRUE.equals(shared);
    }
}
