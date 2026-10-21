package com.dissertacao.logadvisor.backend.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dissertacao.logadvisor.backend.service.RulesFileService;
import com.dissertacao.logadvisor.backend.service.RulesFileService.Category;
import com.dissertacao.logadvisor.backend.service.RulesFileService.RuleItem;
import com.dissertacao.logadvisor.backend.service.RulesFileService.Source;
import com.dissertacao.logadvisor.backend.service.RulesFileService.TechSection;

import lombok.RequiredArgsConstructor;

/**
 * The predefined rules (search mode RULES) for users to browse: technology sections, the general rules and the
 * bibliography. The instructions written for the LLM (PARTE 1) and the file's limits (PARTE 8) are not exposed.
 */
@RestController
@RequiredArgsConstructor
public class RulesController {

    private final RulesFileService rules;

    /** {@code key} lets the frontend translate the label. */
    public record RuleGroup(String key, String label, List<RuleItem> items) {}

    public record RulesView(String version, List<TechSection> technologies, List<RuleGroup> groups, List<Source> sources) {}

    private static final Map<Category, String> LABELS = Map.of(
            Category.UNIVERSAL, "Universal rules",
            Category.SECURITY, "Security practices",
            Category.STANDARDS, "Standards and regulations",
            Category.ANONYMISATION, "Anonymisation techniques",
            Category.DATA_TYPE, "Data types in logs",
            Category.NEVER_LOG, "Never log",
            Category.GDPR, "GDPR",
            Category.RETENTION, "Retention",
            Category.ENCRYPTION, "Encryption and access control");

    @GetMapping("/rules")
    public ResponseEntity<RulesView> rules() {
        List<RuleGroup> groups = new ArrayList<>();
        for (Category c : Category.values()) {
            groups.add(new RuleGroup(c.name(), LABELS.get(c), rules.items(c)));
            if (c == Category.SECURITY) {
                List<RuleItem> events = rules.getEventCodes().entrySet().stream()
                        .map(e -> new RuleItem(e.getKey(), Category.SECURITY, e.getValue()))
                        .toList();
                groups.add(new RuleGroup("EVENT_CODES", "Security event codes", events));
            }
        }
        return ResponseEntity.ok(new RulesView(
                rules.getVersion(),
                List.copyOf(rules.getSections().values()),
                groups,
                List.copyOf(rules.getBibliography().values())));
    }
}
