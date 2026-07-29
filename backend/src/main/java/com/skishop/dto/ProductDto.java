package com.skishop.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Product API payload consumed by the storefront frontend.
 *
 * @param id product identifier
 * @param manufacturer ski product manufacturer
 * @param name product name
 * @param category product category
 * @param description searchable product description
 * @param price price in JPY
 * @param stockStatus stable stock status enum name
 * @param imageUrl optional product image URL
 * @param createdAt product creation time
 * @param updatedAt product update time
 */
public record ProductDto(
		UUID id,
		String manufacturer,
		String name,
		String category,
		String description,
		BigDecimal price,
		String stockStatus,
		String imageUrl,
		Instant createdAt,
		Instant updatedAt
) {
}
