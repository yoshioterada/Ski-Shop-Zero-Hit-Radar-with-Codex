package com.skishop.dto;

import java.util.List;

/**
 * Response for product listing requests.
 *
 * @param items products for the current request
 * @param totalCount total matching products before limit is applied
 */
public record ProductListResponse(List<ProductDto> items, long totalCount) {
}
