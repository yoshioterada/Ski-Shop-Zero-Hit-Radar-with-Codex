package com.skishop.service;

import com.skishop.dto.ZeroHitItemDto;
import com.skishop.entity.ZeroHitSearch;

import org.springframework.stereotype.Component;

/**
 * Maps persisted zero-hit aggregates to frontend-facing DTOs.
 */
@Component
public class ZeroHitMapper {

	/**
	 * Converts a zero-hit aggregate to an admin dashboard row.
	 *
	 * @param zeroHitSearch persisted aggregate
	 * @return DTO with camelCase JSON fields
	 */
	public ZeroHitItemDto toDto(ZeroHitSearch zeroHitSearch) {
		return new ZeroHitItemDto(
				zeroHitSearch.getId(),
				zeroHitSearch.getKeyword(),
				zeroHitSearch.getNormalizedKeyword(),
				zeroHitSearch.getHitCount(),
				zeroHitSearch.getPriority(),
				zeroHitSearch.getEstimatedOpportunityLoss(),
				zeroHitSearch.getFirstSearchedAt(),
				zeroHitSearch.getLastSearchedAt());
	}
}
