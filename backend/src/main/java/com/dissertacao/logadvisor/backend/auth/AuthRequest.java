package com.dissertacao.logadvisor.backend.auth;

import lombok.Data;

@Data
public class AuthRequest {
    private String email;
    private String password;
}
