package com.skishop.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Admin login request.
 *
 * @param username admin username
 * @param password admin password supplied by the user
 */
public record LoginRequest(@NotBlank String username, @NotBlank String password) {
}
