package com.skishop.service;

import com.skishop.entity.Product;

import java.util.List;
import java.util.Locale;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.lang.Nullable;

/**
 * Builds Product query specifications for listing and search use cases.
 */
public final class ProductSpecifications {

	private ProductSpecifications() {
	}

	/**
	 * Filters products by one or more normalized categories.
	 */
	public static Specification<Product> categoryIn(@Nullable List<String> categories) {
		return (root, query, criteriaBuilder) -> {
			if (categories == null || categories.isEmpty()) {
				return criteriaBuilder.conjunction();
			}
			return root.get("category").in(categories);
		};
	}

	/**
	 * Searches manufacturer, name, category, and description with a lower-case contains match.
	 */
	public static Specification<Product> containsKeyword(@Nullable String keyword) {
		return (root, query, criteriaBuilder) -> {
			if (keyword == null || keyword.isBlank()) {
				return criteriaBuilder.conjunction();
			}
			String pattern = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
			return criteriaBuilder.or(
					criteriaBuilder.like(criteriaBuilder.lower(root.get("manufacturer")), pattern),
					criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), pattern),
					criteriaBuilder.like(criteriaBuilder.lower(root.get("category")), pattern),
					criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), pattern));
		};
	}
}
