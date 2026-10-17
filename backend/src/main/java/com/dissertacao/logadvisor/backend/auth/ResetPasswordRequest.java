package com.dissertacao.logadvisor.backend.auth;

import lombok.Data;

@Data
public class ResetPasswordRequest {
    private String newPassword;
}
