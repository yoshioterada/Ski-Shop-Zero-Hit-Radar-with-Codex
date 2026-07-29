package com.skishop.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Aggregated record for a valid product search that returned zero results.
 */
@Entity
@Table(name = "zero_hit_searches")
public class ZeroHitSearch {

	@Id
	@Column(nullable = false, updatable = false)
	private UUID id;

	@Column(nullable = false)
	private String keyword;

	@Column(name = "normalized_keyword", nullable = false, unique = true)
	private String normalizedKeyword;

	@Column(name = "hit_count", nullable = false)
	private int hitCount;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private Priority priority;

	@Column(name = "estimated_opportunity_loss", nullable = false, precision = 12, scale = 2)
	private BigDecimal estimatedOpportunityLoss;

	@Column(name = "first_searched_at", nullable = false)
	private Instant firstSearchedAt;

	@Column(name = "last_searched_at", nullable = false)
	private Instant lastSearchedAt;

	protected ZeroHitSearch() {
	}

	/**
	 * Creates a zero-hit aggregate with all business fields initialized.
	 */
	ZeroHitSearch(
			UUID id,
			String keyword,
			String normalizedKeyword,
			int hitCount,
			Priority priority,
			BigDecimal estimatedOpportunityLoss,
			Instant firstSearchedAt,
			Instant lastSearchedAt) {
		this.id = Objects.requireNonNull(id);
		this.keyword = requireText(keyword, "keyword");
		this.normalizedKeyword = requireText(normalizedKeyword, "normalizedKeyword");
		if (hitCount < 1) {
			throw new IllegalArgumentException("hitCount must be at least 1");
		}
		this.hitCount = hitCount;
		this.priority = Objects.requireNonNull(priority);
		if (this.priority != priorityFor(hitCount)) {
			throw new IllegalArgumentException("priority must match hitCount");
		}
		this.estimatedOpportunityLoss = requireNonNegativeMoney(estimatedOpportunityLoss);
		this.firstSearchedAt = Objects.requireNonNull(firstSearchedAt);
		this.lastSearchedAt = Objects.requireNonNull(lastSearchedAt);
		if (this.firstSearchedAt.isAfter(this.lastSearchedAt)) {
			throw new IllegalArgumentException("firstSearchedAt must not be after lastSearchedAt");
		}
	}

	/**
	 * Recreates a persisted aggregate while enforcing the same invariants as business mutations.
	 */
	public static ZeroHitSearch restore(
			UUID id,
			String keyword,
			String normalizedKeyword,
			int hitCount,
			Priority priority,
			BigDecimal estimatedOpportunityLoss,
			Instant firstSearchedAt,
			Instant lastSearchedAt) {
		return new ZeroHitSearch(
				id,
				keyword,
				normalizedKeyword,
				hitCount,
				priority,
				estimatedOpportunityLoss,
				firstSearchedAt,
				lastSearchedAt);
	}

	/**
	 * Creates a first zero-hit aggregate for a normalized keyword.
	 *
	 * @param keyword display keyword from the user search
	 * @param normalizedKeyword normalized duplicate-prevention key
	 * @param estimatedOpportunityLoss calculated opportunity loss for the first hit
	 * @param searchedAt current search time
	 * @return initialized aggregate with `hitCount=1`
	 */
	public static ZeroHitSearch firstHit(
			String keyword,
			String normalizedKeyword,
			BigDecimal estimatedOpportunityLoss,
			Instant searchedAt) {
		return new ZeroHitSearch(
				UUID.randomUUID(),
				keyword,
				normalizedKeyword,
				1,
				priorityFor(1),
				estimatedOpportunityLoss,
				searchedAt,
				searchedAt);
	}

	/**
	 * Applies another zero-hit search while preserving the first searched time.
	 *
	 * @param displayKeyword latest display keyword
	 * @param newEstimatedOpportunityLoss recalculated opportunity loss
	 * @param searchedAt current search time
	 */
	public void recordRepeat(
			String displayKeyword,
			BigDecimal newEstimatedOpportunityLoss,
			Instant searchedAt) {
		Instant nextSearchedAt = Objects.requireNonNull(searchedAt);
		if (firstSearchedAt != null && nextSearchedAt.isBefore(firstSearchedAt)) {
			throw new IllegalArgumentException("searchedAt must not be before firstSearchedAt");
		}
		this.keyword = requireText(displayKeyword, "displayKeyword");
		this.hitCount += 1;
		this.estimatedOpportunityLoss = requireNonNegativeMoney(newEstimatedOpportunityLoss);
		this.priority = priorityFor(this.hitCount);
		this.lastSearchedAt = nextSearchedAt;
	}

	private static String requireText(String value, String fieldName) {
		if (value == null || value.isBlank()) {
			throw new IllegalArgumentException(fieldName + " must not be blank");
		}
		return value;
	}

	private static BigDecimal requireNonNegativeMoney(BigDecimal value) {
		if (value == null || value.signum() < 0) {
			throw new IllegalArgumentException("estimatedOpportunityLoss must be non-negative");
		}
		return value;
	}

	private static Priority priorityFor(int hitCount) {
		if (hitCount >= 5) {
			return Priority.HIGH;
		}
		if (hitCount >= 2) {
			return Priority.MEDIUM;
		}
		return Priority.LOW;
	}

	@PrePersist
	void prePersist() {
		if (id == null) {
			id = UUID.randomUUID();
		}
		Instant now = Instant.now();
		if (firstSearchedAt == null) {
			firstSearchedAt = now;
		}
		if (lastSearchedAt == null) {
			lastSearchedAt = now;
		}
	}

	public UUID getId() {
		return id;
	}

	public String getKeyword() {
		return keyword;
	}

	public String getNormalizedKeyword() {
		return normalizedKeyword;
	}

	public int getHitCount() {
		return hitCount;
	}

	public Priority getPriority() {
		return priority;
	}

	public BigDecimal getEstimatedOpportunityLoss() {
		return estimatedOpportunityLoss;
	}

	public Instant getFirstSearchedAt() {
		return firstSearchedAt;
	}

	public Instant getLastSearchedAt() {
		return lastSearchedAt;
	}
}
