package com.skishop.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

class ZeroHitDomainTests {

	private final KeywordNormalizer keywordNormalizer = new KeywordNormalizer();
	private final OpportunityLossCalculator opportunityLossCalculator = new OpportunityLossCalculator();
	private final ZeroHitPriorityDecider priorityDecider = new ZeroHitPriorityDecider();
	private final ZeroHitDemandPolicy demandPolicy = new ZeroHitDemandPolicy(opportunityLossCalculator, priorityDecider);

	@Test
	void keywordNormalizerTrimsLowercasesAndCollapsesWhitespace() {
		assertThat(keywordNormalizer.normalize("  Powder   Finder\tXL  ")).isEqualTo("powder finder xl");
		assertThat(keywordNormalizer.normalize(null)).isEmpty();
		assertThat(keywordNormalizer.normalize("   ")).isEmpty();
	}

	@Test
	void opportunityLossCalculatorUsesHitCountTimesAverageProductPrice() {
		assertThat(opportunityLossCalculator.calculate(3, new BigDecimal("12345.678")))
				.isEqualByComparingTo("37037.03");
		assertThat(opportunityLossCalculator.calculate(0, new BigDecimal("12345.67")))
				.isEqualByComparingTo("0.00");
		assertThat(opportunityLossCalculator.calculate(3, null))
				.isEqualByComparingTo("0.00");
	}

	@Test
	void priorityDeciderUsesMvpHitCountThresholds() {
		assertThat(priorityDecider.decide(1)).isEqualTo(com.skishop.entity.Priority.LOW);
		assertThat(priorityDecider.decide(2)).isEqualTo(com.skishop.entity.Priority.MEDIUM);
		assertThat(priorityDecider.decide(5)).isEqualTo(com.skishop.entity.Priority.HIGH);
	}

	@Test
	void demandPolicyReturnsPriorityAndLossFromSameHitCount() {
		ZeroHitDemandSignals signals = demandPolicy.calculate(5, new BigDecimal("1200.00"));

		assertThat(signals.priority()).isEqualTo(com.skishop.entity.Priority.HIGH);
		assertThat(signals.estimatedOpportunityLoss()).isEqualByComparingTo("6000.00");
		assertThatThrownBy(() -> demandPolicy.calculate(0, new BigDecimal("1200.00")))
				.isInstanceOf(IllegalArgumentException.class);
	}
}
