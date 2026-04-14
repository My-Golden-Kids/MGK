package com.mgk.bemgk.dto.product;

import com.mgk.bemgk.entity.ProductType;
import java.math.BigDecimal;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ProductPersonalizedReportResponse {

    private Long productId;
    private String productName;
    private ProductType productType;
    private String recommendationType;
    private String description;
    private String url;
    private Boolean isActive;
    private BigDecimal benefitRate;
    private BigDecimal benefitAmount;
    private BigDecimal benefitLimitAmount;
    private Integer benefitLimitCount;
    private String benefitPeriod;
    private String targetCategory;
    private String sourceType;
    private Boolean eligible;
    private Boolean recommendedForFinanceReport;
    private String recommendationReason;
    private String personalizedReport;
    private BigDecimal averageMonthlyExpense;
    private BigDecimal hospitalExpense;
    private BigDecimal foodExpense;
    private Long hospitalVisitCount;
    private BigDecimal estimatedMonthlyBenefit;
    private BigDecimal estimatedAnnualBenefit;
}
