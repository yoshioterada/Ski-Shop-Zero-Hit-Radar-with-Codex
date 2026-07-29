package com.skishop.dto;

import com.skishop.entity.Priority;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * A single zero-hit demand row for the admin radar table.
 */
public record ZeroHitItemDto(
		UUID id,
		String keyword,
		String normalizedKeyword,
		int hitCount,
		Priority priority,
		BigDecimal estimatedOpportunityLoss,
		Instant firstSearchedAt,
		Instant lastSearchedAt) {
}
