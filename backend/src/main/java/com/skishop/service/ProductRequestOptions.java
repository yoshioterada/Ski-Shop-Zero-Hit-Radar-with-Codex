package com.skishop.service;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.lang.Nullable;

/**
 * Validates and normalizes product list/search query parameters.
 */
public final class ProductRequestOptions {

	public static final int DEFAULT_LIMIT = 20;
	public static final int MAX_LIMIT = 100;
	public static final String DEFAULT_SORT = "createdAt,desc";

	private ProductRequestOptions() {
	}

	/**
	 * Converts nullable request parameters into safe repository options.
	 *
	 * @param limit requested maximum number of rows
	 * @param sort requested sort token
	 * @return pageable with validated limit and sort
	 */
	public static Pageable toPageable(@Nullable Integer limit, @Nullable String sort) {
		int safeLimit = limit == null ? DEFAULT_LIMIT : limit;
		if (safeLimit < 1 || safeLimit > MAX_LIMIT) {
			throw new IllegalArgumentException("limit must be between 1 and 100");
		}
		return PageRequest.of(0, safeLimit, toSort(sort));
	}

	/**
	 * Maps the frontend sort contract to entity field sorting.
	 *
	 * @param sort requested sort token
	 * @return Spring Data sort
	 */
	public static Sort toSort(@Nullable String sort) {
		String requestedSort = sort == null || sort.isBlank() ? DEFAULT_SORT : sort.trim();
		return switch (requestedSort) {
			case "createdAt,desc" -> Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by("name"));
			case "price,asc" -> Sort.by(Sort.Direction.ASC, "price").and(Sort.by("name"));
			case "price,desc" -> Sort.by(Sort.Direction.DESC, "price").and(Sort.by("name"));
			default -> throw new IllegalArgumentException("sort must be one of createdAt,desc, price,asc, or price,desc");
		};
	}

	/**
	 * Normalizes category filter aliases used by the current frontend into backend seed categories.
	 *
	 * @param category raw category query parameter
	 * @return categories to filter by, or empty when all categories should be included
	 */
	public static List<String> normalizeCategories(@Nullable String category) {
		if (category == null || category.isBlank() || "all".equalsIgnoreCase(category.trim())) {
			return List.of();
		}
		String normalized = category.trim().toLowerCase();
		return switch (normalized) {
			case "boots" -> List.of("ski boots");
			case "accessories" -> List.of("bindings", "helmets", "gloves", "wax", "tuning goods");
			default -> List.of(normalized);
		};
	}
}
