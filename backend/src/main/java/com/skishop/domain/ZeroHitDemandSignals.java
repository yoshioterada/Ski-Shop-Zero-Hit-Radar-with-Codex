package com.skishop.domain;

import com.skishop.entity.Priority;

import java.math.BigDecimal;

/**
 * Derived demand values that must stay aligned with a zero-hit aggregate's hit count.
 */
public record ZeroHitDemandSignals(Priority priority, BigDecimal estimatedOpportunityLoss) {

	public ZeroHitDemandSignals {
		if (priority == null) {
			throw new IllegalArgumentException("priority must not be null");
		}
		if (estimatedOpportunityLoss == null || estimatedOpportunityLoss.signum() < 0) {
			throw new IllegalArgumentException("estimatedOpportunityLoss must be non-negative");
		}
	}
}
