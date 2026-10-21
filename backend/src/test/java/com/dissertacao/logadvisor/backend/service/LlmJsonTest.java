package com.dissertacao.logadvisor.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.google.gson.JsonParser;

class LlmJsonTest {

    @Test
    void rawLineBreaksInsideStringsAreEscaped() {
        String raw = "{\"securityGuidance\": \"- AUTH_FAILURE\n- AUTHZ_DENIED\",\n \"dataTypes\": \"a\\\"b\tc\"}";

        var obj = JsonParser.parseString(LogAdvisorService.escapeControlCharsInStrings(raw)).getAsJsonObject();

        assertThat(obj.get("securityGuidance").getAsString()).isEqualTo("- AUTH_FAILURE\n- AUTHZ_DENIED");
        assertThat(obj.get("dataTypes").getAsString()).isEqualTo("a\"b\tc");
    }

    @Test
    void readsTheWaitFromGroqRateLimitErrors() {
        String error = "{\"error\":{\"message\":\"Rate limit reached ... Please try again in 15.21s. Need more tokens?\","
                + "\"code\":\"rate_limit_exceeded\"}}";

        assertThat(LogAdvisorService.retryAfterSeconds(error)).isEqualTo(15.21);
        assertThat(LogAdvisorService.retryAfterSeconds("rate_limit_exceeded try again in 1m2.5s")).isEqualTo(62.5);
        assertThat(LogAdvisorService.retryAfterSeconds("connection reset")).isNull();
    }

    @Test
    void readsTheLabelledLinesOfTheKeywordAnswer() {
        String answer = "TECHNOLOGIES: Python, Django, PostgreSQL\ncontext: hotel, payments";

        assertThat(LogAdvisorService.lineValue(answer, "TECHNOLOGIES")).isEqualTo("Python, Django, PostgreSQL");
        assertThat(LogAdvisorService.lineValue(answer, "CONTEXT")).isEqualTo("hotel, payments");
        assertThat(LogAdvisorService.lineValue("Python, Django", "TECHNOLOGIES")).isNull();
    }

    @Test
    void literalBackslashNBecomesALineBreak() {
        assertThat(LogAdvisorService.fixDoubleEscapes("- a\\n- b")).isEqualTo("- a\n- b");
    }
}
