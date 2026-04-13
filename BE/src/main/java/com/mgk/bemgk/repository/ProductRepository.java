package com.mgk.bemgk.repository;

import com.mgk.bemgk.entity.Product;
import com.mgk.bemgk.entity.ProductType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {

    // 추천 상품 조회
    List<Product> findByIsActiveTrue();

    Optional<Product> findFirstByProductTypeAndIsActiveTrue(ProductType productType);
}
