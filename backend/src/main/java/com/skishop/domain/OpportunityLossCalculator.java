package com.skishop.domain;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Component;

/**
 * Calculates estimated missed revenue from zero-hit search volume.
 */
@Component
public class OpportunityLossCalculator {

	/**
	 * Calculates `hitCount x averageProductPrice` using currency scale.
	 *
	 * @param hitCount number of zero-hit searches
	 * @param averageProductPrice average product price in JPY
	 * @return estimated opportunity loss with two decimal places
	 */
	public BigDecimal calculate(int hitCount, BigDecimal averageProductPrice) {
		if (hitCount <= 0 || averageProductPrice == null) {
			return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
		}
		return averageProductPrice
				.multiply(BigDecimal.valueOf(hitCount))
				.setScale(2, RoundingMode.HALF_UP);
	}
}
