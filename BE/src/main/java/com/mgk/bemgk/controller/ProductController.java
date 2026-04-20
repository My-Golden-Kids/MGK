package com.mgk.bemgk.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mgk.bemgk.dto.product.ProductPersonalizedReportResponse;
import com.mgk.bemgk.dto.product.ProductResponse;
import com.mgk.bemgk.entity.Product;
import com.mgk.bemgk.service.CurrentUserService;
import com.mgk.bemgk.service.ProductService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class ProductController {

	private final ProductService productService;
	private final CurrentUserService currentUserService;

	// 상품 목록 조회
	@GetMapping
	public List<ProductResponse> getProducts() {
		return productService.getProducts()
			.stream()
			.map(ProductResponse::from)
			.toList();
	}

	// 상품 상세 조회
	@GetMapping("/{productId}")
	public ProductResponse getProduct(@PathVariable Long productId) {
		Product product = productService.getProduct(productId);
		return ProductResponse.from(product);
	}

	@GetMapping("/personalized")
	public List<ProductPersonalizedReportResponse> getPersonalizedProducts(
		@RequestParam(required = false) Long petId
	) {
		Long userId = currentUserService.getCurrentUserIdOrDefault();
		return productService.getPersonalizedProductReports(userId, petId);
	}

	@GetMapping("/personalized/featured")
	public ProductPersonalizedReportResponse getFeaturedPersonalizedProduct(
		@RequestParam(required = false) Long petId
	) {
		Long userId = currentUserService.getCurrentUserIdOrDefault();
		return productService.getFeaturedPersonalizedProduct(userId, petId);
	}
}
