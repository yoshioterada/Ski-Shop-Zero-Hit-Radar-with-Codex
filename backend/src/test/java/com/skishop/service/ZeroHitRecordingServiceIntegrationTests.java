package com.skishop.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.skishop.config.FixedClockTestConfig;
import com.skishop.entity.Priority;
import com.skishop.entity.ZeroHitSearch;
import com.skishop.repository.ProductRepository;
import com.skishop.repository.ZeroHitSearchRepository;

import java.math.BigDecimal;
import java.time.Instant;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

/**
 * Verifies transactional zero-hit upsert behavior against the migrated schema.
 */
@SpringBootTest
@ActiveProfiles("test")
@Import(FixedClockTestConfig.class)
@TestPropertySource(properties = {
		"spring.flyway.enabled=true",
		"spring.jpa.hibernate.ddl-auto=validate"
})
class ZeroHitRecordingServiceIntegrationTests {

	private final ZeroHitRecordingService zeroHitRecordingService;
	private final ZeroHitSearchRepository zeroHitSearchRepository;
	private final ProductRepository productRepository;

	@Autowired
	ZeroHitRecordingServiceIntegrationTests(
			ZeroHitRecordingService zeroHitRecordingService,
			ZeroHitSearchRepository zeroHitSearchRepository,
			ProductRepository productRepository) {
		this.zeroHitRecordingService = zeroHitRecordingService;
		this.zeroHitSearchRepository = zeroHitSearchRepository;
		this.productRepository = productRepository;
	}

	@BeforeEach
	void clearZeroHits() {
		zeroHitSearchRepository.deleteAll();
	}

	@Test
	void recordRejectsBlankKeywords() {
		assertThatThrownBy(() -> zeroHitRecordingService.record("   "))
				.isInstanceOf(IllegalArgumentException.class);
	}

	@Test
	void firstRecordInsertsAggregateWithCalculatedSignals() {
		ZeroHitSearch recorded = zeroHitRecordingService.record("  Powder Finder  ");

		assertThat(recorded.getKeyword()).isEqualTo("Powder Finder");
		assertThat(recorded.getNormalizedKeyword()).isEqualTo("powder finder");
		assertThat(recorded.getHitCount()).isEqualTo(1);
		assertThat(recorded.getFirstSearchedAt()).isEqualTo(Instant.parse("2026-02-01T10:15:30Z"));
		assertThat(recorded.getLastSearchedAt()).isEqualTo(Instant.parse("2026-02-01T10:15:30Z"));
		assertThat(recorded.getPriority()).isEqualTo(Priority.LOW);
		assertThat(recorded.getEstimatedOpportunityLoss())
				.isEqualByComparingTo(productRepository.averagePrice().multiply(BigDecimal.ONE));
		assertThat(zeroHitSearchRepository.findByNormalizedKeyword("powder finder")).isPresent();
	}

	@Test
	void repeatedRecordIncrementsExistingAggregateWithoutChangingFirstSearchedAt() {
		ZeroHitSearch first = zeroHitRecordingService.record("Kids Touring Setup");
		ZeroHitSearch second = zeroHitRecordingService.record("  kids   touring setup ");

		assertThat(zeroHitSearchRepository.count()).isEqualTo(1);
		assertThat(second.getId()).isEqualTo(first.getId());
		assertThat(second.getHitCount()).isEqualTo(2);
		assertThat(second.getFirstSearchedAt()).isEqualTo(first.getFirstSearchedAt());
		assertThat(second.getLastSearchedAt()).isEqualTo(Instant.parse("2026-02-01T10:15:30Z"));
		assertThat(second.getPriority()).isEqualTo(Priority.MEDIUM);
		assertThat(second.getEstimatedOpportunityLoss())
				.isEqualByComparingTo(productRepository.averagePrice().multiply(BigDecimal.valueOf(2)));
	}

	@Test
	void priorityBecomesHighAtFiveHits() {
		for (int i = 0; i < 5; i++) {
			zeroHitRecordingService.record("Race Plate Demand");
		}

		ZeroHitSearch recorded = zeroHitSearchRepository.findByNormalizedKeyword("race plate demand").orElseThrow();
		assertThat(recorded.getHitCount()).isEqualTo(5);
		assertThat(recorded.getPriority()).isEqualTo(Priority.HIGH);
	}
}
