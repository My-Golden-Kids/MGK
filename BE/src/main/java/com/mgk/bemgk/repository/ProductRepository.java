package com.mgk.bemgk.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mgk.bemgk.entity.Product;
import com.mgk.bemgk.entity.ProductType;

public interface ProductRepository extends JpaRepository<Product, Long> {

	// 추천 상품 조회
	List<Product> findByIsActiveTrue();

	Optional<Product> findFirstByProductTypeAndIsActiveTrue(ProductType productType);

	List<Product> findByIsActiveFalse();
}
