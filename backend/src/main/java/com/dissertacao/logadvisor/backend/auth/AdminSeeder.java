package com.dissertacao.logadvisor.backend.auth;

import java.time.LocalDateTime;

import com.dissertacao.logadvisor.backend.model.Role;
import com.dissertacao.logadvisor.backend.model.User;
import com.dissertacao.logadvisor.backend.repository.SearchHistoryRepository;
import com.dissertacao.logadvisor.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final SearchHistoryRepository searchHistoryRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username}")
    private String username;

    @Value("${app.admin.password}")
    private String password;

    @Override
    @Transactional
    public void run(String... args) {
        User admin = userRepository.findByEmail(username).orElse(null);
        if (admin == null) {
            admin = userRepository.save(User.builder()
                    .email(username)
                    .password(passwordEncoder.encode(password))
                    .role(Role.ADMIN)
                    .createdAt(LocalDateTime.now())
                    .build());
            log.info("Admin user '{}' created", username);
        } else if (!admin.isAdmin()) {
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);
            log.info("Admin role granted to '{}'", username);
        }

        // Analyses saved before history had an owner are attributed to the admin
        int adopted = searchHistoryRepository.assignOrphansTo(admin);
        if (adopted > 0) log.info("{} analyses without owner assigned to admin", adopted);
    }
}
