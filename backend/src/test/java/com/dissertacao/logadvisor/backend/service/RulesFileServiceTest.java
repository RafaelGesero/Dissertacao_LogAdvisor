package com.dissertacao.logadvisor.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.dissertacao.logadvisor.backend.service.RulesFileService.Category;
import com.dissertacao.logadvisor.backend.service.RulesFileService.Match;
import com.dissertacao.logadvisor.backend.service.RulesFileService.MatchType;

class RulesFileServiceTest {

    private static RulesFileService rules;

    @BeforeAll
    static void load() throws Exception {
        rules = new RulesFileService();
        ReflectionTestUtils.setField(rules, "rulesFile", "rules/regras_loggingadvisor_pt.txt");
        rules.load();
    }

    @Test
    void parsesEveryPartOfTheFile() {
        assertThat(rules.getSections()).hasSize(23).containsKeys("java", "java-web", "databases", RulesFileService.FALLBACK_ID);
        assertThat(rules.items(Category.UNIVERSAL)).hasSize(27);
        assertThat(rules.items(Category.SECURITY)).hasSize(12);
        assertThat(rules.items(Category.DATA_TYPE)).hasSize(26);
        assertThat(rules.items(Category.NEVER_LOG)).hasSize(6);
        assertThat(rules.items(Category.RETENTION)).isNotEmpty();
        assertThat(rules.getEventCodes()).containsKeys("AUTH_SUCCESS", "PERFORMANCE_ISSUE");
        assertThat(rules.getBibliography()).containsKeys("Sahin2024", "Dobrowolski2023");
    }

    @Test
    void sectionKeepsTheResponseTemplateAndRules() {
        var java = rules.section("java");
        assertThat(java.template().get(0)).startsWith("Mandatory Fields:");
        assertThat(java.template()).anyMatch(l -> l.startsWith("Log Template:"));
        assertThat(java.securityEvents()).contains("AUTH_SUCCESS", "AUTH_FAILURE");
        assertThat(java.rules()).anyMatch(r -> r.startsWith("[JV01]"));
        assertThat(java.recognisesDerived()).contains("Kotlin");
    }

    @Test
    void notesAreAttachedToTheirRule() {
        assertThat(rules.items(Category.UNIVERSAL))
                .filteredOn(i -> i.id().equals("U06"))
                .singleElement()
                .satisfies(i -> assertThat(i.text()).contains("Nota:"));
    }

    @Test
    void matchesDirectDerivedAndCombinedSections() {
        List<Match> matches = rules.match(List.of("Spring Boot", "PostgreSQL"), "A web shop", 6);

        assertThat(matches).anySatisfy(m -> {
            assertThat(m.section().id()).isEqualTo("java-web");
            assertThat(m.type()).isEqualTo(MatchType.DIRECT);
        });
        assertThat(matches).anySatisfy(m -> {
            assertThat(m.section().id()).isEqualTo("databases");
            assertThat(m.type()).isEqualTo(MatchType.DERIVED);
        });
        // «Combinar com» of Java Web
        assertThat(matches).anySatisfy(m -> assertThat(m.section().id()).isEqualTo("java"));
    }

    @Test
    void unknownTechnologyFallsBackToTheGenericBaseline() {
        List<Match> matches = rules.match(List.of("Elixir"), "", 6);

        assertThat(matches).singleElement().satisfies(m -> {
            assertThat(m.section().id()).isEqualTo(RulesFileService.FALLBACK_ID);
            assertThat(m.type()).isEqualTo(MatchType.FALLBACK);
            assertThat(m.matchedBy()).containsExactly("Elixir");
        });
    }

    @Test
    void frontEndFrameworksAreNotMistakenForAndroid() {
        // "React" is part of "React Native" (Android, by derivation), but front ends are not covered (PARTE 8.1)
        List<Match> matches = rules.match(List.of("React"), "", 6);

        assertThat(matches).singleElement().satisfies(m ->
                assertThat(m.section().id()).isEqualTo(RulesFileService.FALLBACK_ID));
    }

    @Test
    void abbreviatedNamesStillMatch() {
        assertThat(rules.match(List.of("Postgres"), "", 6))
                .anySatisfy(m -> assertThat(m.section().id()).isEqualTo("databases"));
        assertThat(rules.match(List.of("Spring Boot 3"), "", 6))
                .anySatisfy(m -> assertThat(m.section().id()).isEqualTo("java-web"));
    }

    @Test
    void portugueseContextWordsSelectTheRegulatedSection() {
        List<Match> matches = rules.match(List.of("Python"), "Aplicação de saúde com dados de pacientes", 6);

        assertThat(matches).anySatisfy(m -> assertThat(m.section().id()).isEqualTo("regulated-systems"));
    }

    @Test
    void neverReturnsMoreSectionsThanTheCap() {
        List<Match> matches = rules.match(
                List.of("Java", "Python", "PHP", "C#", "Android", "Kubernetes", "Oracle"), "microservices", 4);

        assertThat(matches).hasSize(4);
    }
}
