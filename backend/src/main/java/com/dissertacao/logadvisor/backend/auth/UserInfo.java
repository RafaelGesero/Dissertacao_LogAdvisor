package com.dissertacao.logadvisor.backend.auth;

import com.dissertacao.logadvisor.backend.model.User;

public record UserInfo(Long id, String email, String role, String createdAt, long analyses) {

    public static UserInfo from(User user, long analyses) {
        return new UserInfo(
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                user.getCreatedAt() != null ? user.getCreatedAt().toString() : null,
                analyses);
    }
}
