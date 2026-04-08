package com.mgk.bemgk.repository;

import com.mgk.bemgk.entity.Product;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {

    // 추천 상품 조회
    List<Product> findByIsActiveTrue();
}
