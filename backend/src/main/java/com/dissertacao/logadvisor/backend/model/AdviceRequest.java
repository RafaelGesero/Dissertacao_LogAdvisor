package com.dissertacao.logadvisor.backend.model;

import lombok.Data;

@Data
public class AdviceRequest {
    private String query;
    private String mode;
}
