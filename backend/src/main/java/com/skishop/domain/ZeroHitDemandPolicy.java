package com.skishop.domain;

import java.math.BigDecimal;

import org.springframework.stereotype.Component;

/**
 * Calculates all demand-derived values from the same hit count input.
 */
@Component
public class ZeroHitDemandPolicy {

	private final OpportunityLossCalculator opportunityLossCalculator;
	private final ZeroHitPriorityDecider priorityDecider;

	public ZeroHitDemandPolicy(
			OpportunityLossCalculator opportunityLossCalculator,
			ZeroHitPriorityDecider priorityDecider) {
		this.opportunityLossCalculator = opportunityLossCalculator;
		this.priorityDecider = priorityDecider;
	}

	/**
	 * Calculates priority and opportunity loss for a positive zero-hit count.
	 *
	 * @param hitCount current aggregate hit count
	 * @param averageProductPrice average catalog price used as loss estimate input
	 * @return aligned demand signals for the aggregate
	 */
	public ZeroHitDemandSignals calculate(int hitCount, BigDecimal averageProductPrice) {
		if (hitCount < 1) {
			throw new IllegalArgumentException("hitCount must be at least 1");
		}
		return new ZeroHitDemandSignals(
				priorityDecider.decide(hitCount),
				opportunityLossCalculator.calculate(hitCount, averageProductPrice));
	}
}
