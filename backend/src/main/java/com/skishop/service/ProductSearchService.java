package com.skishop.service;

import com.skishop.dto.ProductDto;
import com.skishop.dto.ProductSearchResponse;
import com.skishop.entity.Product;
import com.skishop.repository.ProductRepository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Application service for product search and later zero-hit recording orchestration.
 */
@Service
public class ProductSearchService implements ProductSearchUseCase {

	private final ProductRepository productRepository;
	private final ProductMapper productMapper;
	private final ZeroHitRecordingService zeroHitRecordingService;

	public ProductSearchService(
			ProductRepository productRepository,
			ProductMapper productMapper,
			ZeroHitRecordingService zeroHitRecordingService) {
		this.productRepository = productRepository;
		this.productMapper = productMapper;
		this.zeroHitRecordingService = zeroHitRecordingService;
	}

	/**
	 * Searches products and records zero-hit demand only for valid non-empty searches with zero results.
	 *
	 * @param keyword raw search keyword
	 * @param limit maximum number of rows
	 * @param category optional category filter
	 * @param sort frontend sort token
	 * @return search response
	 */
	@Transactional
	@Override
	public ProductSearchResponse search(
			@Nullable String keyword,
			@Nullable Integer limit,
			@Nullable String category,
			@Nullable String sort) {
		String trimmedKeyword = keyword == null ? "" : keyword.trim();
		Specification<Product> specification = ProductSpecifications.categoryIn(
				ProductRequestOptions.normalizeCategories(category));
		if (!trimmedKeyword.isBlank()) {
			specification = specification.and(ProductSpecifications.containsKeyword(trimmedKeyword));
		}

		Pageable pageable = ProductRequestOptions.toPageable(limit, sort);
		List<Product> products = productRepository.findAll(specification, pageable).getContent();
		long totalCount = productRepository.count(specification);
		List<ProductDto> items = products.stream().map(productMapper::toDto).toList();
		boolean zeroHitRecorded = false;
		if (!trimmedKeyword.isBlank() && totalCount == 0) {
			zeroHitRecordingService.record(trimmedKeyword);
			zeroHitRecorded = true;
		}
		return new ProductSearchResponse(items, totalCount, zeroHitRecorded);
	}
}
