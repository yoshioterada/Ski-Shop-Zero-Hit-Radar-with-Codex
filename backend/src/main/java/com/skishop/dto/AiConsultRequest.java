package com.skishop.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.Instant;

import org.springframework.lang.Nullable;

/**
 * Admin request for AI-assisted buying and merchandising advice.
 */
public record AiConsultRequest(
		@Nullable @Size(max = 200) String keyword,
		@NotBlank @Size(max = 1000) String question,
		@Nullable @Min(0) @Max(1_000_000) Integer hitCount,
		@Nullable @PastOrPresent Instant lastSearchedAt) {
}
