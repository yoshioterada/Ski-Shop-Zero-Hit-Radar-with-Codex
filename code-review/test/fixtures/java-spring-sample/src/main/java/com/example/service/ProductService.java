package com.example.service;

import com.example.repository.ProductRepository;

public class ProductService {
  private final ProductRepository productRepository;

  public ProductService(ProductRepository productRepository) {
    this.productRepository = productRepository;
  }

  public String findProductName(String id) {
    return productRepository.findName(id);
  }
}
