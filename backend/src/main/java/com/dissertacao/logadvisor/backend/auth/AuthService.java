package com.dissertacao.logadvisor.backend.auth;

import com.dissertacao.logadvisor.backend.config.Messages;

import java.time.LocalDateTime;
import java.util.regex.Pattern;

import com.dissertacao.logadvisor.backend.model.Role;
import com.dissertacao.logadvisor.backend.model.User;
import com.dissertacao.logadvisor.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    /** A plain name ("rafael") or an email; compared in lower case. */
    private static final Pattern USERNAME = Pattern.compile("^[a-z0-9._@-]{3,50}$");
    private static final int MIN_PASSWORD = 5;
    private static final int MAX_PASSWORD = 128;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(AuthRequest request) {
        String email = normalize(request.getEmail());
        if (!USERNAME.matcher(email).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, Messages.t("auth.username.invalid"));
        }
        validatePassword(request.getPassword());
        if (userRepository.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, Messages.t("auth.username.taken"));
        }
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .createdAt(LocalDateTime.now())
                .build();
        userRepository.save(user);
        log.info("User registered: id={}", user.getId());
        return toResponse(user);
    }

    public AuthResponse login(AuthRequest request) {
        String email = normalize(request.getEmail());
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword())
            );
        } catch (AuthenticationException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, Messages.t("auth.credentials.invalid"));
        }
        User user = userRepository.findByEmail(email).orElseThrow();
        return toResponse(user);
    }

    public void changePassword(User user, ChangePasswordRequest request) {
        if (request.getCurrentPassword() == null
                || !passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, Messages.t("auth.password.current.wrong"));
        }
        validatePassword(request.getNewPassword());
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, Messages.t("auth.password.same"));
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed: userId={}", user.getId());
    }

    public void resetPassword(Long userId, ResetPasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, Messages.t("auth.user.notFound")));
        validatePassword(request.getNewPassword());
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password reset by admin: userId={}", userId);
    }

    private void validatePassword(String password) {
        if (password == null || password.length() < MIN_PASSWORD || password.length() > MAX_PASSWORD) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    Messages.t("auth.password.length", MIN_PASSWORD, MAX_PASSWORD));
        }
    }

    private String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private AuthResponse toResponse(User user) {
        return AuthResponse.builder()
                .token(jwtService.generateToken(user))
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}
