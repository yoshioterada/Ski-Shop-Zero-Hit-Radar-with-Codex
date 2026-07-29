package com.skishop.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * Response for product search requests.
 *
 * @param items products matching the query
 * @param totalCount total matching products before limit is applied
 * @param hasZeroHitRecorded whether the search was recorded as zero-hit demand
 */
public record ProductSearchResponse(
		List<ProductDto> items,
		long totalCount,
		@JsonProperty("zeroHitRecorded") boolean hasZeroHitRecorded
) {
}
