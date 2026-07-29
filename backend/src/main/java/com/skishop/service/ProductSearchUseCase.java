package com.skishop.service;

import com.skishop.dto.ProductSearchResponse;

import org.springframework.lang.Nullable;

/**
 * Product search use case exposed to public API controllers.
 */
public interface ProductSearchUseCase {

	/**
	 * Searches products and records eligible zero-hit demand.
	 *
	 * @param keyword optional raw search keyword
	 * @param limit optional maximum number of rows
	 * @param category optional category filter
	 * @param sort optional frontend sort token
	 * @return search response
	 */
	ProductSearchResponse search(
			@Nullable String keyword,
			@Nullable Integer limit,
			@Nullable String category,
			@Nullable String sort);
}
