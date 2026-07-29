package com.example.controller;

import com.example.service.ProductService;

public class ProductController {
  private final ProductService productService;

  public ProductController(ProductService productService) {
    this.productService = productService;
  }

  public String getProduct(String id) {
    return productService.findProductName(id);
  }
}
