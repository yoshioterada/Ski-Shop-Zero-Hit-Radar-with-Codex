package com.skishop.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;

/**
 * Verifies entity lifecycle defaults that protect DB inserts outside Flyway seed data.
 */
class EntityLifecycleTests {

	@Test
	void productPrePersistInitializesMissingIdentityAndTimestamps() {
		Product product = new Product();

		product.prePersist();

		assertThat(product.getId()).isNotNull();
		assertThat(product.getCreatedAt()).isNotNull();
		assertThat(product.getUpdatedAt()).isNotNull();
	}

	@Test
	void productPrePersistPreservesExistingIdentityAndTimestamps() {
		UUID id = UUID.randomUUID();
		Instant createdAt = Instant.parse("2026-02-01T10:15:30Z");
		Instant updatedAt = Instant.parse("2026-02-02T10:15:30Z");
		Product product = new Product(
				id,
				"Atomic",
				"Test Ski",
				"skis",
				"Test description",
				new BigDecimal("1000.00"),
				StockStatus.IN_STOCK,
				"/images/test.jpg",
				createdAt,
				updatedAt);

		product.prePersist();

		assertThat(product.getId()).isEqualTo(id);
		assertThat(product.getCreatedAt()).isEqualTo(createdAt);
		assertThat(product.getUpdatedAt()).isEqualTo(updatedAt);
	}

	@Test
	void productPreUpdateRefreshesUpdatedAtOnly() {
		Instant createdAt = Instant.parse("2026-02-01T10:15:30Z");
		Product product = new Product(
				UUID.randomUUID(),
				"Atomic",
				"Test Ski",
				"skis",
				"Test description",
				new BigDecimal("1000.00"),
				StockStatus.IN_STOCK,
				null,
				createdAt,
				createdAt);

		product.preUpdate();

		assertThat(product.getCreatedAt()).isEqualTo(createdAt);
		assertThat(product.getUpdatedAt()).isAfter(createdAt);
	}

	@Test
	void zeroHitPrePersistInitializesMissingIdentityAndTimestamps() {
		ZeroHitSearch zeroHitSearch = new ZeroHitSearch();

		zeroHitSearch.prePersist();

		assertThat(zeroHitSearch.getId()).isNotNull();
		assertThat(zeroHitSearch.getFirstSearchedAt()).isNotNull();
		assertThat(zeroHitSearch.getLastSearchedAt()).isNotNull();
	}

	@Test
	void zeroHitPrePersistPreservesExistingIdentityAndTimestamps() {
		UUID id = UUID.randomUUID();
		Instant firstSearchedAt = Instant.parse("2026-02-01T10:15:30Z");
		Instant lastSearchedAt = Instant.parse("2026-02-02T10:15:30Z");
		ZeroHitSearch zeroHitSearch = new ZeroHitSearch(
				id,
				"Powder Finder",
				"powder finder",
				3,
				Priority.MEDIUM,
				new BigDecimal("3000.00"),
				firstSearchedAt,
				lastSearchedAt);

		zeroHitSearch.prePersist();

		assertThat(zeroHitSearch.getId()).isEqualTo(id);
		assertThat(zeroHitSearch.getFirstSearchedAt()).isEqualTo(firstSearchedAt);
		assertThat(zeroHitSearch.getLastSearchedAt()).isEqualTo(lastSearchedAt);
	}

	@Test
	void zeroHitConstructorRejectsInvalidAggregateState() {
		Instant searchedAt = Instant.parse("2026-02-01T10:15:30Z");

		assertThatThrownBy(() -> ZeroHitSearch.restore(
				UUID.randomUUID(),
				" ",
				"powder finder",
				1,
				Priority.LOW,
				new BigDecimal("1000.00"),
				searchedAt,
				searchedAt))
				.isInstanceOf(IllegalArgumentException.class);
		assertThatThrownBy(() -> ZeroHitSearch.restore(
				UUID.randomUUID(),
				"Powder Finder",
				"powder finder",
				0,
				Priority.LOW,
				new BigDecimal("1000.00"),
				searchedAt,
				searchedAt))
				.isInstanceOf(IllegalArgumentException.class);
		assertThatThrownBy(() -> ZeroHitSearch.restore(
				UUID.randomUUID(),
				"Powder Finder",
				"powder finder",
				5,
				Priority.LOW,
				new BigDecimal("1000.00"),
				searchedAt,
				searchedAt))
				.isInstanceOf(IllegalArgumentException.class);
		assertThatThrownBy(() -> ZeroHitSearch.restore(
				UUID.randomUUID(),
				"Powder Finder",
				"powder finder",
				1,
				Priority.LOW,
				new BigDecimal("-1.00"),
				searchedAt,
				searchedAt))
				.isInstanceOf(IllegalArgumentException.class);
		assertThatThrownBy(() -> ZeroHitSearch.restore(
				UUID.randomUUID(),
				"Powder Finder",
				"powder finder",
				1,
				Priority.LOW,
				new BigDecimal("1000.00"),
				searchedAt.plusSeconds(1),
				searchedAt))
				.isInstanceOf(IllegalArgumentException.class);
	}

	@Test
	void zeroHitRepeatKeepsDerivedPriorityConsistent() {
		Instant searchedAt = Instant.parse("2026-02-01T10:15:30Z");
		ZeroHitSearch zeroHitSearch = ZeroHitSearch.firstHit(
				"Powder Finder",
				"powder finder",
				new BigDecimal("1000.00"),
				searchedAt);

		zeroHitSearch.recordRepeat("Powder Finder XL", new BigDecimal("2000.00"), searchedAt.plusSeconds(30));

		assertThat(zeroHitSearch.getHitCount()).isEqualTo(2);
		assertThat(zeroHitSearch.getKeyword()).isEqualTo("Powder Finder XL");
		assertThat(zeroHitSearch.getPriority()).isEqualTo(Priority.MEDIUM);
		assertThat(zeroHitSearch.getEstimatedOpportunityLoss()).isEqualByComparingTo("2000.00");
		assertThat(zeroHitSearch.getFirstSearchedAt()).isEqualTo(searchedAt);
		assertThat(zeroHitSearch.getLastSearchedAt()).isEqualTo(searchedAt.plusSeconds(30));
	}
}
