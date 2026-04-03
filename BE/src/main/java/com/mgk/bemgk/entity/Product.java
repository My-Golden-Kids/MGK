package com.mgk.bemgk.entity;

import com.mgk.bemgk.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "products")
@NoArgsConstructor(access = AccessLevel.PROTECTED)

// 카드/적금/보험 추천 규칙 자체를 저장하는 상품 엔티티
public class Product extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "product_type", nullable = false, length = 30)
    private ProductType productType;

    @Column(length = 1000)
    private String description;

    @Column(name = "benefit_rate", precision = 10, scale = 2)
    private BigDecimal benefitRate;

    @Column(name = "benefit_amount", precision = 19, scale = 2)
    private BigDecimal benefitAmount;

    @Column(name = "benefit_limit_amount", precision = 19, scale = 2)
    private BigDecimal benefitLimitAmount;

    @Column(name = "benefit_limit_count")
    private Integer benefitLimitCount;

    @Enumerated(EnumType.STRING)
    @Column(name = "benefit_period", length = 20)
    private BenefitPeriod benefitPeriod;

    @Column(name = "target_category", length = 255)
    private String targetCategory;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 30)
    private SourceType sourceType;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Builder

    // 상품 추천 계산에 필요한 핵심 조건만 저장
    public Product(String name, ProductType productType, String description,
                   BigDecimal benefitRate, BigDecimal benefitAmount,
                   BigDecimal benefitLimitAmount, Integer benefitLimitCount,
                   BenefitPeriod benefitPeriod, String targetCategory,
                   SourceType sourceType, Boolean isActive) {
        this.name = name;
        this.productType = productType;
        this.description = description;
        this.benefitRate = benefitRate;
        this.benefitAmount = benefitAmount;
        this.benefitLimitAmount = benefitLimitAmount;
        this.benefitLimitCount = benefitLimitCount;
        this.benefitPeriod = benefitPeriod;
        this.targetCategory = targetCategory;
        this.sourceType = sourceType;
        this.isActive = isActive;
    }
}
