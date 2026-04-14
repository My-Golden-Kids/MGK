package com.mgk.bemgk.controller;

import com.mgk.bemgk.dto.product.ProductResponse;
import com.mgk.bemgk.dto.product.ProductPersonalizedReportResponse;
import com.mgk.bemgk.entity.Product;
import com.mgk.bemgk.service.CurrentUserService;
import com.mgk.bemgk.service.ProductService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

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
	public List<ProductPersonalizedReportResponse> getPersonalizedProducts() {
		Long userId = currentUserService.getCurrentUserIdOrDefault();
		return productService.getPersonalizedProductReports(userId);
	}

	@GetMapping("/personalized/featured")
	public ProductPersonalizedReportResponse getFeaturedPersonalizedProduct() {
		Long userId = currentUserService.getCurrentUserIdOrDefault();
		return productService.getFeaturedPersonalizedProduct(userId);
	}
}
