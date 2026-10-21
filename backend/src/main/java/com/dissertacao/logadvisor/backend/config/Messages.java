package com.dissertacao.logadvisor.backend.config;

import java.util.Map;

import org.springframework.context.i18n.LocaleContextHolder;

/**
 * User-facing texts in English and Portuguese. The language comes from the request's Accept-Language header,
 * which the frontend sets from the language switch (Spring stores it in {@link LocaleContextHolder}).
 */
public final class Messages {

    private Messages() {}

    /** key -> {English, Portuguese}; values are String.format patterns. */
    private static final Map<String, String[]> TEXTS = Map.ofEntries(
            Map.entry("auth.username.invalid", new String[] {
                    "The username must have 3 to 50 characters: letters, digits, '.', '_', '-' or '@'.",
                    "O nome de utilizador tem de ter entre 3 e 50 caracteres: letras, números, '.', '_', '-' ou '@'."}),
            Map.entry("auth.username.taken", new String[] {
                    "That username already exists.", "Esse nome de utilizador já existe."}),
            Map.entry("auth.credentials.invalid", new String[] {
                    "Invalid username or password.", "Credenciais inválidas."}),
            Map.entry("auth.password.current.wrong", new String[] {
                    "The current password is incorrect.", "A password atual está incorreta."}),
            Map.entry("auth.password.same", new String[] {
                    "The new password must be different from the current one.",
                    "A nova password tem de ser diferente da atual."}),
            Map.entry("auth.password.length", new String[] {
                    "The password must have between %d and %d characters.",
                    "A password tem de ter entre %d e %d caracteres."}),
            Map.entry("auth.user.notFound", new String[] {
                    "User not found.", "Utilizador não encontrado."}),
            Map.entry("history.notFound", new String[] {
                    "Analysis not found.", "Análise não encontrada."}),
            Map.entry("history.notOwner", new String[] {
                    "This analysis belongs to another user.", "Esta análise pertence a outro utilizador."}),
            Map.entry("advice.description.length", new String[] {
                    "The description must have between 1 and %d characters.",
                    "A descrição tem de ter entre 1 e %d caracteres."}),
            Map.entry("llm.tooLarge", new String[] {
                    "The request to Groq is larger than the account's tokens-per-minute limit. Shorten the description "
                            + "or lower the prompt budgets (app.kb/rules.prompt-budget-chars).",
                    "O pedido ao Groq é maior do que o limite de tokens por minuto da conta. Reduz a descrição "
                            + "ou os orçamentos de prompt (app.kb/rules.prompt-budget-chars)."}),
            Map.entry("llm.rateLimit", new String[] {
                    "Groq's tokens-per-minute limit was reached. Wait about a minute and try again.",
                    "O limite de tokens por minuto do Groq foi atingido. Aguarda cerca de um minuto e tenta novamente."}),
            Map.entry("llm.noResponse", new String[] {
                    "The language model did not respond. Try again.",
                    "O modelo de linguagem não respondeu. Tenta novamente."}),
            Map.entry("advice.noInfo", new String[] {
                    "No relevant information was found on this topic",
                    "Não foi encontrada informação relevante sobre o tema em questão"}),
            Map.entry("advice.storageFallback", new String[] {
                    "The storage tips could not be generated separately.",
                    "Não foi possível gerar as dicas de armazenamento separadamente."}),
            Map.entry("rules.llmUnavailable", new String[] {
                    "(LLM unavailable: showing the predefined rules selected for this application.)",
                    "(LLM indisponível: são mostradas as regras predefinidas selecionadas para esta aplicação.)"}),
            Map.entry("advice.generalPractice", new String[] {"(general practice)", "(prática geral)"}),
            Map.entry("rules.universal", new String[] {"Universal rules", "Regras universais"}),
            Map.entry("rules.genericBaseline", new String[] {"Generic baseline (%s)", "Base genérica (%s)"}),
            Map.entry("rules.evidence.direct", new String[] {
                    "Direct match%s in section «%s». Evidence level of the section: %s.",
                    "Correspondência direta%s na secção «%s». Nível de evidência da secção: %s."}),
            Map.entry("rules.evidence.directFor", new String[] {" for %s", " para %s"}),
            Map.entry("rules.evidence.derived", new String[] {
                    "DERIVED: %s is only recognised by derivation in section «%s». This guidance was not studied for %s in the articles.",
                    "DERIVADA: %s só é reconhecido por derivação na secção «%s». Esta orientação não foi estudada para %s nos artigos."}),
            Map.entry("rules.evidence.combined", new String[] {
                    "Related section («Combinar com» of %s): «%s». Evidence level of the section: %s.",
                    "Secção relacionada («Combinar com» de %s): «%s». Nível de evidência da secção: %s."}),
            Map.entry("rules.evidence.fallback", new String[] {
                    "No section of the predefined rules recognises %s, so the generic baseline is used. There is no direct "
                            + "evidence: derive from the closest family (JVM → Java; .NET → C#; dynamic server languages → "
                            + "Python/JavaScript/PHP; native code → C/C++; mobile → Android).",
                    "Nenhuma secção das regras predefinidas reconhece %s, por isso é usada a base genérica. Não há evidência "
                            + "direta: deriva da família mais próxima (JVM → Java; .NET → C#; linguagens dinâmicas de servidor → "
                            + "Python/JavaScript/PHP; código nativo → C/C++; móvel → Android)."}),
            Map.entry("rules.evidence.fallbackDefault", new String[] {
                    "the technologies described", "as tecnologias descritas"}),
            Map.entry("rules.sectionSources", new String[] {"Section sources", "Fontes da secção"}),
            Map.entry("rules.limitations", new String[] {"Limitations", "Limitações"}));

    /** Portuguese tab labels for the technology sections of the rules file (their titles are in English). */
    private static final Map<String, String> SECTION_LABELS_PT = Map.ofEntries(
            Map.entry("web-application", "Aplicação web"),
            Map.entry("ml-python", "Aplicações de Machine Learning"),
            Map.entry("cloud-native", "Cloud-native / Microsserviços / Contentores"),
            Map.entry("saas", "SaaS / Serviços cloud"),
            Map.entry("soa-osgi", "Arquiteturas orientadas a serviços / OSGi"),
            Map.entry("big-data-apache", "Big data / Ecossistema Apache"),
            Map.entry("databases", "Bases de dados"),
            Map.entry("robotics-control", "Robótica / Sistemas de controlo autónomos"),
            Map.entry("web-servers-http", "Servidores web e logs de acesso HTTP"),
            Map.entry("pervasive-sensors", "Sensores e dados de localização"),
            Map.entry("log-management-platforms", "Plataformas de gestão de logs"),
            Map.entry("immutable-storage", "Armazenamento imutável de logs"),
            Map.entry("regulated-systems", "Sistemas regulados e logs de auditoria"));

    /** Tab label of a rules-file section in the request language; {@code english} when there is no translation. */
    public static String sectionLabel(String sectionId, String english) {
        return isPortuguese() ? SECTION_LABELS_PT.getOrDefault(sectionId, english) : english;
    }

    public static boolean isPortuguese() {
        return "pt".equals(LocaleContextHolder.getLocale().getLanguage());
    }

    /** Name of the response language, for LLM prompts. */
    public static String languageName() {
        return isPortuguese() ? "European Portuguese (Portugal)" : "English";
    }

    public static String t(String key, Object... args) {
        String[] texts = TEXTS.get(key);
        if (texts == null) return key;
        String pattern = isPortuguese() ? texts[1] : texts[0];
        return args.length == 0 ? pattern : String.format(pattern, args);
    }
}
