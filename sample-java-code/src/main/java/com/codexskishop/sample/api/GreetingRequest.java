package com.codexskishop.sample.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body for creating a greeting.
 */
public record GreetingRequest(
    @NotBlank
    @Size(max = 40)
    String name) {
}
