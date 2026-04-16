package com.mgk.bemgk.dto.product;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.mgk.bemgk.entity.BenefitPeriod;
import com.mgk.bemgk.entity.Product;
import com.mgk.bemgk.entity.ProductType;
import com.mgk.bemgk.entity.SourceType;

class ProductDtosTest {

	@Test
	void productDtosExposeFieldsAndResolverMapping() {
		Product insurance = Product.builder()
			.name("하나 펫사랑보험")
			.productType(ProductType.INSURANCE)
			.description("보험 상품")
			.url("https://example.com/insurance")
			.benefitRate(BigDecimal.valueOf(2.8))
			.benefitAmount(BigDecimal.valueOf(100000))
			.benefitLimitAmount(BigDecimal.valueOf(4000000))
			.benefitLimitCount(40)
			.benefitPeriod(BenefitPeriod.YEAR)
			.targetCategory("Hospital")
			.sourceType(SourceType.ACCOUNT_BOOK)
			.isActive(false)
			.build();
		ReflectionTestUtils.setField(insurance, "id", 1L);

		Product subscription = Product.builder()
			.name("하나 펫케어 구독")
			.productType(ProductType.CARD)
			.isActive(false)
			.sourceType(SourceType.ACCOUNT_BOOK)
			.build();

		Product petForest = Product.builder()
			.name("하나 펫포레스트")
			.productType(ProductType.INSURANCE)
			.isActive(false)
			.sourceType(SourceType.ACCOUNT_BOOK)
			.build();

		ProductResponse productResponse = ProductResponse.from(insurance);
		ProductPersonalizedReportResponse personalized = ProductPersonalizedReportResponse.builder()
			.productId(1L)
			.productName("하나 펫사랑보험")
			.productType(ProductType.INSURANCE)
			.recommendationType("INSURANCE")
			.description("보험 상품")
			.url("https://example.com/insurance")
			.isActive(false)
			.benefitRate(BigDecimal.valueOf(2.8))
			.benefitAmount(BigDecimal.valueOf(100000))
			.benefitLimitAmount(BigDecimal.valueOf(4000000))
			.benefitLimitCount(40)
			.benefitPeriod("YEAR")
			.targetCategory("Hospital")
			.sourceType("ACCOUNT_BOOK")
			.eligible(true)
			.recommendedForFinanceReport(true)
			.recommendationReason("보험 추천")
			.personalizedReport("연 80만원 절약")
			.averageMonthlyExpense(BigDecimal.valueOf(280000))
			.hospitalExpense(BigDecimal.valueOf(960000))
			.foodExpense(BigDecimal.valueOf(300000))
			.hospitalVisitCount(8L)
			.estimatedMonthlyBenefit(BigDecimal.valueOf(66667))
			.estimatedAnnualBenefit(BigDecimal.valueOf(800000))
			.maxMonthlyBenefitAmount(BigDecimal.valueOf(100000))
			.maxAnnualBenefitAmount(BigDecimal.valueOf(4000000))
			.build();
		ProductRecommendationResponse recommendation = ProductRecommendationResponse.builder()
			.productId(1L)
			.productName("하나 펫사랑보험")
			.productType(ProductType.INSURANCE)
			.description("보험 상품")
			.sourceAmount(BigDecimal.valueOf(960000))
			.usageCount(8L)
			.estimatedBenefitAmount(BigDecimal.valueOf(800000))
			.build();

		assertThat(ProductTypeResolver.resolve(subscription)).isEqualTo(ProductType.SUBSCRIPTION);
		assertThat(ProductTypeResolver.resolve(petForest)).isEqualTo(ProductType.PET_FOREST);
		assertThat(productResponse.getId()).isEqualTo(1L);
		assertThat(productResponse.getProductType()).isEqualTo(ProductType.INSURANCE);
		assertThat(productResponse.getBenefitLimitAmount()).isEqualByComparingTo("4000000");
		assertThat(personalized.getRecommendationType()).isEqualTo("INSURANCE");
		assertThat(personalized.getEstimatedAnnualBenefit()).isEqualByComparingTo("800000");
		assertThat(personalized.getMaxAnnualBenefitAmount()).isEqualByComparingTo("4000000");
		assertThat(recommendation.getUsageCount()).isEqualTo(8L);
		assertThat(recommendation.getEstimatedBenefitAmount()).isEqualByComparingTo("800000");
	}
}
