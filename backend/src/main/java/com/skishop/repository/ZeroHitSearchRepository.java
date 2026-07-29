package com.skishop.repository;

import com.skishop.entity.ZeroHitSearch;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Zero Hit Radar repository for upsert lookups, dashboard rows, and summary calculations.
 */
public interface ZeroHitSearchRepository extends JpaRepository<ZeroHitSearch, UUID> {

	/**
	 * Finds the aggregate row for a normalized keyword.
	 */
	Optional<ZeroHitSearch> findByNormalizedKeyword(String normalizedKeyword);

	/**
	 * Fetches radar rows after a cutoff time. Sorting is supplied by the Pageable.
	 */
	@Query("""
			select z
			from ZeroHitSearch z
			where z.lastSearchedAt >= :since
			""")
	List<ZeroHitSearch> findRadarItems(@Param("since") Instant since, Pageable pageable);

	/**
	 * Counts radar keywords after a cutoff time.
	 */
	@Query("""
			select count(z)
			from ZeroHitSearch z
			where z.lastSearchedAt >= :since
			""")
	long countRadarItems(@Param("since") Instant since);

	/**
	 * Sums search volume after a cutoff time.
	 */
	@Query("""
			select coalesce(sum(z.hitCount), 0)
			from ZeroHitSearch z
			where z.lastSearchedAt >= :since
			""")
	long sumHitCount(@Param("since") Instant since);

	/**
	 * Sums estimated opportunity loss after a cutoff time.
	 */
	@Query("""
			select coalesce(sum(z.estimatedOpportunityLoss), 0)
			from ZeroHitSearch z
			where z.lastSearchedAt >= :since
			""")
	BigDecimal sumEstimatedOpportunityLoss(@Param("since") Instant since);
}
