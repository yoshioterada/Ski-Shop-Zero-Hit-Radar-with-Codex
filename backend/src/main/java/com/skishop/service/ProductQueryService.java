package com.skishop.service;

import com.skishop.dto.ProductListResponse;
import com.skishop.entity.Product;
import com.skishop.repository.ProductRepository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Application service for product list use cases.
 */
@Service
public class ProductQueryService implements ProductQueryUseCase {

	private final ProductRepository productRepository;
	private final ProductMapper productMapper;

	public ProductQueryService(ProductRepository productRepository, ProductMapper productMapper) {
		this.productRepository = productRepository;
		this.productMapper = productMapper;
	}

	/**
	 * Lists products with optional category filtering and validated sorting.
	 *
	 * @param limit maximum number of rows
	 * @param category optional category filter
	 * @param sort frontend sort token
	 * @return product list response
	 */
	@Transactional(readOnly = true)
	@Override
	public ProductListResponse listProducts(@Nullable Integer limit, @Nullable String category, @Nullable String sort) {
		Pageable pageable = ProductRequestOptions.toPageable(limit, sort);
		Specification<Product> specification = ProductSpecifications.categoryIn(
				ProductRequestOptions.normalizeCategories(category));
		List<Product> products = productRepository.findAll(specification, pageable).getContent();
		long totalCount = productRepository.count(specification);
		return new ProductListResponse(products.stream().map(productMapper::toDto).toList(), totalCount);
	}
}
