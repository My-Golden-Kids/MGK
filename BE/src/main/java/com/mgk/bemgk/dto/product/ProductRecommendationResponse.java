package com.mgk.bemgk.dto.product;

import com.mgk.bemgk.entity.ProductType;
import java.math.BigDecimal;
import lombok.Builder;
import lombok.Getter;

// 상품 추천 계산 결과를 반환하는 응답 DTO
@Getter
@Builder
public class ProductRecommendationResponse {

    // 추천 상품 ID
    private Long productId;

    // 추천 상품명
    private String productName;

    // 추천 상품 유형
    private ProductType productType;

    // 상품 요약 설명
    private String description;

    // 혜택 계산의 기준이 된 금액
    private BigDecimal sourceAmount;

    // 혜택 계산에 반영된 사용 횟수
    private Long usageCount;

    // 계산된 예상 혜택 금액
    private BigDecimal estimatedBenefitAmount;
}
