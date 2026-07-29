package com.skishop.service;

import com.skishop.dto.ProductListResponse;

import org.springframework.lang.Nullable;

/**
 * Product listing use case exposed to public API controllers.
 */
public interface ProductQueryUseCase {

	/**
	 * Lists products with optional filtering and sorting.
	 *
	 * @param limit optional maximum number of rows
	 * @param category optional category filter
	 * @param sort optional frontend sort token
	 * @return product list response
	 */
	ProductListResponse listProducts(@Nullable Integer limit, @Nullable String category, @Nullable String sort);
}
