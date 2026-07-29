package com.skishop.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.skishop.config.FixedClockTestConfig;
import com.skishop.entity.Priority;
import com.skishop.entity.ZeroHitSearch;
import com.skishop.repository.ProductRepository;
import com.skishop.repository.ZeroHitSearchRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Verifies the PostgreSQL ON CONFLICT path under concurrent zero-hit writes.
 */
@SpringBootTest
@ActiveProfiles("test")
@Import(FixedClockTestConfig.class)
@Testcontainers(disabledWithoutDocker = true)
@TestPropertySource(properties = {
		"spring.flyway.enabled=true",
		"spring.jpa.hibernate.ddl-auto=validate"
})
class ZeroHitRecordingPostgresConcurrencyTests {

	@Container
	static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

	private final ZeroHitRecordingService zeroHitRecordingService;
	private final ZeroHitSearchRepository zeroHitSearchRepository;
	private final ProductRepository productRepository;

	@Autowired
	ZeroHitRecordingPostgresConcurrencyTests(
			ZeroHitRecordingService zeroHitRecordingService,
			ZeroHitSearchRepository zeroHitSearchRepository,
			ProductRepository productRepository) {
		this.zeroHitRecordingService = zeroHitRecordingService;
		this.zeroHitSearchRepository = zeroHitSearchRepository;
		this.productRepository = productRepository;
	}

	@DynamicPropertySource
	static void postgresProperties(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
		registry.add("spring.datasource.username", POSTGRES::getUsername);
		registry.add("spring.datasource.password", POSTGRES::getPassword);
		registry.add("spring.datasource.driver-class-name", POSTGRES::getDriverClassName);
	}

	@BeforeEach
	void clearZeroHits() {
		zeroHitSearchRepository.deleteAll();
	}

	@Test
	void atomicUpsertPreservesHitCountAcrossConcurrentRecords() throws Exception {
		int parallelRecords = 20;
		CountDownLatch ready = new CountDownLatch(parallelRecords);
		CountDownLatch start = new CountDownLatch(1);
		List<Callable<Void>> tasks = new ArrayList<>();
		for (int i = 0; i < parallelRecords; i++) {
			tasks.add(() -> {
				ready.countDown();
				assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
				start.await(10, TimeUnit.SECONDS);
				zeroHitRecordingService.record("Powder Finder XL");
				return null;
			});
		}

		try (var executor = Executors.newFixedThreadPool(parallelRecords)) {
			List<java.util.concurrent.Future<Void>> futures = tasks.stream().map(executor::submit).toList();
			start.countDown();
			for (java.util.concurrent.Future<Void> future : futures) {
				future.get(20, TimeUnit.SECONDS);
			}
		}

		ZeroHitSearch recorded = zeroHitSearchRepository.findByNormalizedKeyword("powder finder xl").orElseThrow();
		assertThat(zeroHitSearchRepository.count()).isEqualTo(1);
		assertThat(recorded.getHitCount()).isEqualTo(parallelRecords);
		assertThat(recorded.getPriority()).isEqualTo(Priority.HIGH);
		assertThat(recorded.getEstimatedOpportunityLoss())
				.isEqualByComparingTo(expectedLoss(parallelRecords));

		ZeroHitSearch repeated = zeroHitRecordingService.record("  POWDER   FINDER   XL  ");

		assertThat(zeroHitSearchRepository.count()).isEqualTo(1);
		assertThat(repeated.getId()).isEqualTo(recorded.getId());
		assertThat(repeated.getHitCount()).isEqualTo(parallelRecords + 1);
		assertThat(repeated.getKeyword()).isEqualTo("POWDER   FINDER   XL");
		assertThat(repeated.getPriority()).isEqualTo(Priority.HIGH);
		assertThat(repeated.getEstimatedOpportunityLoss())
				.isEqualByComparingTo(expectedLoss(parallelRecords + 1));
	}

	private BigDecimal expectedLoss(int hitCount) {
		return productRepository.averagePrice()
				.multiply(BigDecimal.valueOf(hitCount))
				.setScale(2, RoundingMode.HALF_UP);
	}
}
