package com.skishop.service;

import com.skishop.dto.ZeroHitItemDto;
import com.skishop.dto.ZeroHitListResponse;
import com.skishop.dto.ZeroHitSummaryDto;
import com.skishop.repository.ZeroHitSearchRepository;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Queries zero-hit radar rows and matching summary metrics for admin users.
 */
@Service
public class ZeroHitQueryService implements ZeroHitQueryUseCase {

	private static final int DEFAULT_DAYS = 30;
	private static final int DEFAULT_LIMIT = 20;
	private static final int MAX_LIMIT = 100;

	private final ZeroHitSearchRepository zeroHitSearchRepository;
	private final ZeroHitMapper zeroHitMapper;
	private final Clock clock;

	public ZeroHitQueryService(
			ZeroHitSearchRepository zeroHitSearchRepository,
			ZeroHitMapper zeroHitMapper,
			Clock clock) {
		this.zeroHitSearchRepository = zeroHitSearchRepository;
		this.zeroHitMapper = zeroHitMapper;
		this.clock = clock;
	}

	/**
	 * Lists zero-hit demand rows with a period filter, allowed sort token, and bounded limit.
	 *
	 * @param days recent period in days; defaults to 30
	 * @param sort sort token: `hitCount` or `lastSearchedAt`
	 * @param limit maximum number of rows; defaults to 20 and is capped at 100
	 * @return rows and period summary
	 */
	@Transactional(readOnly = true)
	@Override
	public ZeroHitListResponse listZeroHits(@Nullable Integer days, @Nullable String sort, @Nullable Integer limit) {
		int resolvedDays = resolveDays(days);
		int resolvedLimit = resolveLimit(limit);
		Sort resolvedSort = resolveSort(sort);
		Instant since = Instant.now(clock).minus(resolvedDays, ChronoUnit.DAYS);

		List<ZeroHitItemDto> items = zeroHitSearchRepository
				.findRadarItems(since, PageRequest.of(0, resolvedLimit, resolvedSort))
				.stream()
				.map(zeroHitMapper::toDto)
				.toList();
		ZeroHitSummaryDto summary = new ZeroHitSummaryDto(
				zeroHitSearchRepository.countRadarItems(since),
				zeroHitSearchRepository.sumHitCount(since),
				zeroHitSearchRepository.sumEstimatedOpportunityLoss(since));

		return new ZeroHitListResponse(items, summary);
	}

	private int resolveDays(@Nullable Integer days) {
		if (days == null) {
			return DEFAULT_DAYS;
		}
		if (days < 1 || days > 365) {
			throw new IllegalArgumentException("days must be between 1 and 365");
		}
		return days;
	}

	private int resolveLimit(@Nullable Integer limit) {
		if (limit == null) {
			return DEFAULT_LIMIT;
		}
		if (limit < 1 || limit > MAX_LIMIT) {
			throw new IllegalArgumentException("limit must be between 1 and 100");
		}
		return limit;
	}

	private Sort resolveSort(@Nullable String sort) {
		if (sort == null || sort.isBlank() || "hitCount".equals(sort) || "hitCount,desc".equals(sort)) {
			return Sort.by(Sort.Order.desc("hitCount"), Sort.Order.desc("lastSearchedAt"));
		}
		if ("lastSearchedAt".equals(sort) || "lastSearchedAt,desc".equals(sort)) {
			return Sort.by(Sort.Order.desc("lastSearchedAt"), Sort.Order.desc("hitCount"));
		}
		throw new IllegalArgumentException("Unsupported zero-hit sort token");
	}
}
