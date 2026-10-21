package com.dissertacao.logadvisor.backend.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

/**
 * Loads and indexes the LoggingAdvisor rules file (search mode 1.1).
 *
 * <p>The file is far too large to send to the LLM in one request (Groq free tier: 8000 tokens/minute),
 * so it is split into addressable pieces: one {@link TechSection} per technology (PARTE 6), one
 * {@link RuleItem} per rule line of PARTES 2-5, the security event codes (3.3) and the bibliography (PARTE 7).
 */
@Slf4j
@Service
public class RulesFileService {

    public static final String FALLBACK_ID = "generic-fallback";

    public enum Category { UNIVERSAL, SECURITY, STANDARDS, ANONYMISATION, DATA_TYPE, NEVER_LOG, GDPR, RETENTION, ENCRYPTION }

    public record RuleItem(String id, Category category, String text) {}

    public record Source(String key, String reference, String citation) {}

    public record TechSection(String id, String name, String category, String evidence, List<String> sources,
                              List<String> recognises, List<String> recognisesDerived, List<String> combineWith,
                              List<String> template, List<String> notes, List<String> rules, String limitations) {

        /** Short tab label: "Java Web (Spring, Servlet...)" -> "Java Web". */
        public String label() {
            int paren = name.indexOf(" (");
            return paren > 0 ? name.substring(0, paren) : name;
        }

        public List<String> securityEvents() {
            for (String line : template) {
                if (line.startsWith("Security Events:")) {
                    List<String> codes = new ArrayList<>();
                    for (String c : line.substring("Security Events:".length()).split(",")) {
                        if (!c.isBlank()) codes.add(c.trim());
                    }
                    return codes;
                }
            }
            return List.of();
        }

        static final class Builder {
            private final String id;
            private final String name;
            String category = "";
            String evidence = "";
            String limitations = "";
            List<String> sources = List.of();
            List<String> recognises = List.of();
            List<String> recognisesDerived = List.of();
            final List<String> combineWith = new ArrayList<>();
            final List<String> template = new ArrayList<>();
            final List<String> notes = new ArrayList<>();
            final List<String> rules = new ArrayList<>();

            Builder(String id, String name) {
                this.id = id;
                this.name = name;
            }

            TechSection build() {
                return new TechSection(id, name, category, evidence, sources, recognises, recognisesDerived,
                        List.copyOf(combineWith), List.copyOf(template), List.copyOf(notes), List.copyOf(rules),
                        limitations);
            }
        }
    }

    private static final Pattern RULE_LINE = Pattern.compile("^\\s*\\[([A-Z]+\\d+)\\]\\s*(.*)$");
    private static final Pattern TECH_HEADER = Pattern.compile("^TECNOLOGIA:\\s*(.+?)\\s+\\(id:\\s*([\\w-]+)\\)\\s*$");
    private static final Pattern EVENT_CODE = Pattern.compile("^\\s+([A-Z][A-Z_]+) \\(([^;]+); (INFO|WARN|ERROR)\\): (.*)$");
    private static final Pattern SOURCE_LINE = Pattern.compile("^(\\w+) \\| (.+?) \\| (.+?) \\| Âmbito:");
    private static final Pattern COMBINE_ID = Pattern.compile("\\(([\\w-]+)\\)\\s*(?:;|$)");
    private static final Pattern SUBSECTION = Pattern.compile("^(\\d\\.\\d) ");

    @Value("${app.rules.file:rules/regras_loggingadvisor_pt.txt}")
    private String rulesFile;

    @Getter private String version = "";
    @Getter private final Map<String, TechSection> sections = new LinkedHashMap<>();
    @Getter private final List<RuleItem> items = new ArrayList<>();
    @Getter private final Map<String, String> eventCodes = new LinkedHashMap<>();
    @Getter private final Map<String, Source> bibliography = new LinkedHashMap<>();

    @PostConstruct
    void load() throws IOException {
        try (InputStream in = new ClassPathResource(rulesFile).getInputStream()) {
            parse(new String(in.readAllBytes(), StandardCharsets.UTF_8));
        }
        log.info("Rules file loaded ({}): {} technology sections, {} rules, {} event codes, {} sources",
                version, sections.size(), items.size(), eventCodes.size(), bibliography.size());
    }

    void parse(String text) {
        List<String> lines = text.lines().toList();
        if (lines.size() > 1) version = lines.get(1).trim();

        int part = 0;
        String subsection = "";
        TechSection.Builder tech = null;
        String techBlock = "";
        RuleItem lastItem = null;

        for (String line : lines) {
            if (line.startsWith("PARTE ")) {
                part = Character.getNumericValue(line.charAt(6));
                subsection = "";
                lastItem = null;
                continue;
            }
            if (line.startsWith("====") || line.startsWith("----")) continue;

            if (part >= 2 && part <= 5) {
                Matcher sub = SUBSECTION.matcher(line);
                if (sub.find()) {
                    subsection = sub.group(1);
                    lastItem = null;
                    continue;
                }
                Category category = categoryOf(part, subsection);
                Matcher rule = RULE_LINE.matcher(line);
                Matcher event = EVENT_CODE.matcher(line);
                if (rule.matches() && category != null) {
                    lastItem = new RuleItem(rule.group(1), category, line.trim());
                    items.add(lastItem);
                } else if ("3.3".equals(subsection) && event.matches()) {
                    eventCodes.put(event.group(1), line.trim());
                } else if (line.startsWith("      Nota:") && lastItem != null) {
                    // A note belongs to the rule right above it
                    items.set(items.size() - 1, lastItem = new RuleItem(lastItem.id(), lastItem.category(),
                            lastItem.text() + " " + line.trim()));
                } else if (category == Category.RETENTION && !line.isBlank() && !line.startsWith(" ")) {
                    // "O corpus reporta PRÁTICAS de retenção, não limites legais..." must travel with the table
                    String id = countItems(category) == 0 ? "5.3-intro" : "5.3-" + (countItems(category) + 1);
                    items.add(lastItem = new RuleItem(id, category, line.trim()));
                } else if (line.startsWith("  - ") && category != null && category != Category.SECURITY) {
                    String id = subsection + "-" + (countItems(category) + 1);
                    lastItem = new RuleItem(id, category, line.substring(4).trim());
                    items.add(lastItem);
                }
            } else if (part == 6) {
                Matcher header = TECH_HEADER.matcher(line);
                if (header.matches()) {
                    if (tech != null) addSection(tech.build());
                    tech = new TechSection.Builder(header.group(2), header.group(1).trim());
                    techBlock = "";
                    continue;
                }
                if (tech == null) continue;
                if (line.startsWith("Categoria:")) {
                    for (String field : line.split("\\|")) {
                        String f = field.trim();
                        if (f.startsWith("Categoria:")) tech.category = after(f, "Categoria:");
                        else if (f.startsWith("Evidência:")) tech.evidence = after(f, "Evidência:");
                        else if (f.startsWith("Fontes da secção:")) tech.sources = splitList(after(f, "Fontes da secção:"));
                    }
                } else if (line.startsWith("Reconhece por derivação:")) {
                    tech.recognisesDerived = terms(after(line, "Reconhece por derivação:"));
                } else if (line.startsWith("Reconhece:")) {
                    tech.recognises = terms(after(line, "Reconhece:"));
                } else if (line.startsWith("Combinar com:")) {
                    Matcher ids = COMBINE_ID.matcher(line);
                    while (ids.find()) tech.combineWith.add(ids.group(1));
                } else if (line.startsWith("Formato-modelo:")) {
                    techBlock = "template";
                } else if (line.startsWith("Regras:")) {
                    techBlock = "rules";
                } else if (line.startsWith("Limitações:")) {
                    tech.limitations = after(line, "Limitações:");
                    techBlock = "";
                } else if (line.startsWith("Bibliotecas/ferramentas")) {
                    techBlock = "";
                } else if ("template".equals(techBlock) && line.startsWith("    ")) {
                    String t = line.substring(4);
                    if (t.startsWith("Nota")) tech.notes.add(t.trim());
                    else tech.template.add(t);
                } else if ("rules".equals(techBlock) && RULE_LINE.matcher(line).matches()) {
                    tech.rules.add(line.trim());
                }
            } else if (part == 7) {
                if (tech != null) {
                    addSection(tech.build());
                    tech = null;
                }
                Matcher src = SOURCE_LINE.matcher(line);
                if (src.find()) {
                    bibliography.put(src.group(1), new Source(src.group(1), src.group(2).trim(), src.group(3).trim()));
                }
            }
        }
        if (tech != null) addSection(tech.build());
    }

    // ── Technology matching ─────────────────────────────────────────────────

    public enum MatchType { DIRECT, DERIVED, COMBINED, FALLBACK }

    public record Match(TechSection section, MatchType type, Set<String> matchedBy) {}

    /**
     * Picks the sections for the technologies named by the user, following PARTE 1 §3 of the file:
     * direct matches on «Reconhece», derived ones on «Reconhece por derivação», the «Combinar com»
     * sections of direct matches, and the generic baseline for technologies nobody recognises.
     */
    public List<Match> match(List<String> keywords, String description, int maxSections) {
        return match(keywords, List.of(), description, maxSections);
    }

    /**
     * Like {@link #match(List, String, int)}, with {@code context} terms (business or regulatory context such as
     * "healthcare" or "hotel") that may select a section but never trigger the generic baseline.
     */
    public List<Match> match(List<String> keywords, List<String> context, String description, int maxSections) {
        Map<String, Match> matches = new LinkedHashMap<>();
        List<String> unmatched = new ArrayList<>();

        List<String> all = new ArrayList<>(keywords);
        all.addAll(context);
        for (String keyword : all) {
            Match m = matchKeyword(keyword);
            if (m == null) {
                if (!context.contains(keyword)) unmatched.add(keyword);
            } else {
                matches.merge(m.section().id(), m, (a, b) -> {
                    a.matchedBy().addAll(b.matchedBy());
                    return a.type() == MatchType.DIRECT || b.type() != MatchType.DIRECT ? a
                            : new Match(a.section(), MatchType.DIRECT, a.matchedBy());
                });
            }
        }

        // Context cues the keyword extractor may miss (PARTE 1 §3: regulated, cloud, sensors, web)
        String text = normalizeText(description);
        CONTEXT_CUES.forEach((sectionId, cues) -> {
            for (String cue : cues) {
                if (sections.containsKey(sectionId) && containsWord(text, cue)) {
                    matches.computeIfAbsent(sectionId, id -> new Match(sections.get(id), MatchType.DIRECT,
                            new LinkedHashSet<>())).matchedBy().add(cue);
                    break;
                }
            }
        });

        List<Match> result = new ArrayList<>(matches.values());
        if (!unmatched.isEmpty() || result.isEmpty()) {
            Set<String> by = new LinkedHashSet<>(unmatched);
            result.add(new Match(sections.get(FALLBACK_ID), MatchType.FALLBACK, by));
        }

        // «Combinar com» of direct matches, while there is room
        for (Match m : List.copyOf(result)) {
            if (m.type() != MatchType.DIRECT) continue;
            for (String id : m.section().combineWith()) {
                if (result.size() >= maxSections) break;
                boolean present = result.stream().anyMatch(r -> r.section().id().equals(id));
                if (!present && sections.containsKey(id)) {
                    result.add(new Match(sections.get(id), MatchType.COMBINED,
                            new LinkedHashSet<>(Set.of(m.section().label()))));
                }
            }
        }
        return result.size() > maxSections ? result.subList(0, maxSections) : result;
    }

    private Match matchKeyword(String keyword) {
        String k = normalizeTerm(keyword);
        if (k.isEmpty()) return null;
        Match best = null;
        int bestScore = 0;
        for (TechSection s : sections.values()) {
            int direct = score(k, s.recognises());
            int derived = score(k, s.recognisesDerived());
            // A direct hit always beats a derived one; longer terms beat shorter ones
            int sc = Math.max(direct > 0 ? 1000 + direct : 0, derived);
            if (sc > bestScore) {
                bestScore = sc;
                best = new Match(s, direct > 0 && sc == 1000 + direct ? MatchType.DIRECT : MatchType.DERIVED,
                        new LinkedHashSet<>(List.of(keyword.trim())));
            }
        }
        return best;
    }

    /**
     * Exact normalised match scores the term length + 100. Partial matches score less and are only accepted when
     * the keyword contains the term ("Spring Boot 3" -> "Spring Boot") or is most of it ("Postgres" ->
     * "PostgreSQL"), so that "React" is not mistaken for "React Native" (front ends are not covered, PARTE 8.1).
     */
    private int score(String keyword, List<String> terms) {
        int best = 0;
        for (String term : terms) {
            String t = normalizeTerm(term);
            if (t.isEmpty()) continue;
            if (t.equals(keyword)) {
                best = Math.max(best, 100 + t.length());
            } else if (t.length() >= 4 && keyword.contains(t)) {
                best = Math.max(best, t.length());
            } else if (keyword.length() >= 6 && t.contains(keyword) && keyword.length() * 10 >= t.length() * 7) {
                best = Math.max(best, keyword.length());
            }
        }
        return best;
    }

    /** Portuguese/English context words from PARTE 1 §3 that select a section even if no keyword names it. */
    private static final Map<String, List<String>> CONTEXT_CUES = Map.of(
            "regulated-systems", List.of("rgpd", "gdpr", "hipaa", "pci", "saude", "health", "healthcare",
                    "hospital", "clinica", "pagamento", "pagamentos", "payment", "payments", "banca", "banco",
                    "bank", "banking", "auditoria", "audit", "compliance", "seguros", "insurance"),
            "cloud-native", List.of("microsservicos", "microservicos", "microservices", "microservice",
                    "kubernetes", "docker", "contentores", "containers", "serverless"),
            "pervasive-sensors", List.of("sensores", "sensor", "sensors", "gps", "iot", "localizacao",
                    "geolocalizacao", "wearable"),
            "web-application", List.of("login", "autenticacao", "authentication", "website", "web",
                    "rest", "api"));

    // ── Helpers ──────────────────────────────────────────────────────────────

    public List<RuleItem> items(Category category) {
        return items.stream().filter(i -> i.category() == category).toList();
    }

    public TechSection section(String id) {
        return sections.get(id);
    }

    /** Bibliography keys (PARTE 7) cited in the given texts, in first-seen order. */
    public List<Source> citedSources(List<String> texts) {
        Set<String> keys = new LinkedHashSet<>();
        for (String t : texts) {
            for (String key : bibliography.keySet()) {
                if (t.contains(key)) keys.add(key);
            }
        }
        return keys.stream().map(bibliography::get).toList();
    }

    private void addSection(TechSection s) {
        sections.put(s.id(), s);
    }

    private long countItems(Category c) {
        return items.stream().filter(i -> i.category() == c).count();
    }

    private static Category categoryOf(int part, String subsection) {
        return switch (part) {
            case 2 -> Category.UNIVERSAL;
            case 3 -> switch (subsection) {
                case "3.1" -> Category.SECURITY;
                case "3.4" -> Category.STANDARDS;
                case "3.5" -> Category.ANONYMISATION;
                default -> null;
            };
            case 4 -> Category.DATA_TYPE;
            case 5 -> switch (subsection) {
                case "5.1" -> Category.NEVER_LOG;
                case "5.2" -> Category.GDPR;
                case "5.3" -> Category.RETENTION;
                case "5.4" -> Category.ENCRYPTION;
                default -> null;
            };
            default -> null;
        };
    }

    private static String after(String s, String prefix) {
        return s.substring(s.indexOf(prefix) + prefix.length()).trim();
    }

    private static List<String> splitList(String s) {
        List<String> out = new ArrayList<>();
        for (String p : s.split(",")) if (!p.isBlank()) out.add(p.trim());
        return out;
    }

    /** "Kotlin (JVM), Scala (JVM)" -> [Kotlin (JVM), Kotlin, Scala (JVM), Scala]; "(nenhum)" -> []. */
    private static List<String> terms(String s) {
        if (s.startsWith("(nenhum)")) return List.of();
        List<String> out = new ArrayList<>();
        for (String p : splitList(s)) {
            out.add(p);
            int paren = p.indexOf(" (");
            if (paren > 0) out.add(p.substring(0, paren));
        }
        return Collections.unmodifiableList(out);
    }

    static String normalizeTerm(String s) {
        return stripAccents(s).toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9+#]", "");
    }

    private static String normalizeText(String s) {
        return " " + stripAccents(s == null ? "" : s).toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9+#]+", " ") + " ";
    }

    private static boolean containsWord(String normalizedText, String word) {
        return normalizedText.contains(" " + word + " ");
    }

    private static String stripAccents(String s) {
        return Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
    }
}
