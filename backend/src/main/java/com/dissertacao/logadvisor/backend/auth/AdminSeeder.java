package com.dissertacao.logadvisor.backend.auth;

import com.dissertacao.logadvisor.backend.model.User;
import com.dissertacao.logadvisor.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username}")
    private String username;

    @Value("${app.admin.password}")
    private String password;

    @Override
    public void run(String... args) {
        if (userRepository.findByEmail(username).isPresent()) return;
        userRepository.save(User.builder()
                .email(username)
                .password(passwordEncoder.encode(password))
                .build());
        log.info("Admin user '{}' created", username);
    }
}
