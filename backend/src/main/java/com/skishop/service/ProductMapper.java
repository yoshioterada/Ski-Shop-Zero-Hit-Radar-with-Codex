package com.skishop.service;

import com.skishop.dto.ProductDto;
import com.skishop.entity.Product;

import org.springframework.stereotype.Component;

/**
 * Maps product persistence entities to stable frontend DTOs.
 */
@Component
public class ProductMapper {

	/**
	 * Converts a product entity into the public API DTO.
	 *
	 * @param product persisted product
	 * @return API DTO with camelCase JSON fields
	 */
	public ProductDto toDto(Product product) {
		return new ProductDto(
				product.getId(),
				product.getManufacturer(),
				product.getName(),
				product.getCategory(),
				product.getDescription(),
				product.getPrice(),
				product.getStockStatus().name(),
				product.getImageUrl(),
				product.getCreatedAt(),
				product.getUpdatedAt());
	}
}
