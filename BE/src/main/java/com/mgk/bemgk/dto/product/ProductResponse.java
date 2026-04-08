package com.mgk.bemgk.dto.product;

import com.mgk.bemgk.entity.Product;
import com.mgk.bemgk.entity.ProductType;
import java.math.BigDecimal;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ProductResponse {

	private Long id;
	private String name;
	private ProductType productType;
	private String description;
	private BigDecimal benefitRate;
	private BigDecimal benefitAmount;
	private BigDecimal benefitLimitAmount;
	private Integer benefitLimitCount;
	private String benefitPeriod;
	private String targetCategory;
	private String sourceType;
	private Boolean isActive;

	public static ProductResponse from(Product product) {
		return ProductResponse.builder()
			.id(product.getId())
			.name(product.getName())
			.productType(product.getProductType())
			.description(product.getDescription())
			.benefitRate(product.getBenefitRate())
			.benefitAmount(product.getBenefitAmount())
			.benefitLimitAmount(product.getBenefitLimitAmount())
			.benefitLimitCount(product.getBenefitLimitCount())
			.benefitPeriod(product.getBenefitPeriod() != null ? product.getBenefitPeriod().name() : null)
			.targetCategory(product.getTargetCategory())
			.sourceType(product.getSourceType() != null ? product.getSourceType().name() : null)
			.isActive(product.getIsActive())
			.build();
	}
}