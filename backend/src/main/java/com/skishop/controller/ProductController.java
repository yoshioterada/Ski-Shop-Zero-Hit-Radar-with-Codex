package com.skishop.controller;

import com.skishop.dto.ProductListResponse;
import com.skishop.dto.ProductSearchResponse;
import com.skishop.service.ProductQueryUseCase;
import com.skishop.service.ProductSearchUseCase;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import org.springframework.lang.Nullable;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public product API used by the Codex Ski Shop storefront.
 */
@RestController
@RequestMapping("/api/products")
@Validated
public class ProductController {

	private final ProductQueryUseCase productQueryUseCase;
	private final ProductSearchUseCase productSearchUseCase;

	public ProductController(ProductQueryUseCase productQueryUseCase, ProductSearchUseCase productSearchUseCase) {
		this.productQueryUseCase = productQueryUseCase;
		this.productSearchUseCase = productSearchUseCase;
	}

	/**
	 * Returns products for initial storefront display and product list filtering.
	 */
	@GetMapping
	public ProductListResponse listProducts(
			@RequestParam(required = false) @Nullable @Min(1) @Max(100) Integer limit,
			@RequestParam(required = false) @Nullable @Size(max = 80) String category,
			@RequestParam(required = false) @Nullable
					@Pattern(regexp = "createdAt,desc|price,asc|price,desc") String sort) {
		return productQueryUseCase.listProducts(limit, category, sort);
	}

	/**
	 * Searches products and records valid zero-result keywords for Zero Hit Radar.
	 */
	@GetMapping("/search")
	public ProductSearchResponse searchProducts(
			@RequestParam(required = false) @Nullable @Size(max = 100) String q,
			@RequestParam(required = false) @Nullable @Min(1) @Max(100) Integer limit,
			@RequestParam(required = false) @Nullable @Size(max = 80) String category,
			@RequestParam(required = false) @Nullable
					@Pattern(regexp = "createdAt,desc|price,asc|price,desc") String sort) {
		return productSearchUseCase.search(q, limit, category, sort);
	}
}
