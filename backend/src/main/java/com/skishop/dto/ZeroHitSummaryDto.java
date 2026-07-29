package com.skishop.dto;

import java.math.BigDecimal;

/**
 * Aggregated zero-hit demand metrics for the admin dashboard cards.
 */
public record ZeroHitSummaryDto(
		long zeroHitKeywordCount,
		long searchVolume,
		BigDecimal estimatedOpportunityLoss) {
}
