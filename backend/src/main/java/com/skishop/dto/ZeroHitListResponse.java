package com.skishop.dto;

import java.util.List;

/**
 * Admin radar response containing limited rows and matching-period summary totals.
 */
public record ZeroHitListResponse(
		List<ZeroHitItemDto> items,
		ZeroHitSummaryDto summary) {
}
