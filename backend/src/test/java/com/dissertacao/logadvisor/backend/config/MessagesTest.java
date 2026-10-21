package com.dissertacao.logadvisor.backend.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Locale;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.i18n.LocaleContextHolder;

class MessagesTest {

    @AfterEach
    void reset() {
        LocaleContextHolder.resetLocaleContext();
    }

    @Test
    void followsTheRequestLanguage() {
        LocaleContextHolder.setLocale(Locale.forLanguageTag("pt-PT"));
        assertThat(Messages.t("auth.password.length", 5, 128)).isEqualTo("A password tem de ter entre 5 e 128 caracteres.");
        assertThat(Messages.languageName()).contains("Portuguese");

        LocaleContextHolder.setLocale(Locale.ENGLISH);
        assertThat(Messages.t("auth.password.length", 5, 128)).isEqualTo("The password must have between 5 and 128 characters.");
        assertThat(Messages.languageName()).isEqualTo("English");
    }

    @Test
    void unknownKeysAreReturnedAsIs() {
        assertThat(Messages.t("does.not.exist")).isEqualTo("does.not.exist");
    }
}
