package com.mgk.bemgk.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.mgk.bemgk.dto.product.ProductPersonalizedReportResponse;
import com.mgk.bemgk.dto.product.ProductRecommendationResponse;
import com.mgk.bemgk.entity.Product;
import com.mgk.bemgk.entity.ProductType;
import com.mgk.bemgk.entity.SourceType;
import com.mgk.bemgk.entity.Pet;
import com.mgk.bemgk.repository.AccountBookRepository;
import com.mgk.bemgk.repository.AccountRepository;
import com.mgk.bemgk.repository.PetRepository;
import com.mgk.bemgk.repository.ProductRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

	@Mock
	private ProductRepository productRepository;

	@Mock
	private AccountRepository accountRepository;

	@Mock
	private AccountBookRepository accountBookRepository;

	@Mock
	private PetRepository petRepository;

	@InjectMocks
	private ProductService productService;

	@Test
	void getFeaturedPersonalizedProduct_returnsCardForHighSpendNonHospitalHeavyUser() {
		Long userId = 1L;
		Product card = product("하나 펫카드", ProductType.CARD, false, null, null, BigDecimal.valueOf(40_000));
		Product insurance = product("하나 펫보험", ProductType.INSURANCE, false, BigDecimal.valueOf(100_000), 20,
			null);
		Product savings = product("하나 펫적금", ProductType.SAVINGS, false, null, null, BigDecimal.valueOf(168_000));

		when(productRepository.findAll()).thenReturn(List.of(card, insurance, savings));
		when(petRepository.findByUser_Id(userId)).thenReturn(List.of());
		when(accountBookRepository.findFirstPetSpendDateByUserId(userId))
			.thenReturn(LocalDateTime.now().minusMonths(12));
		when(accountBookRepository.sumPetExpenseLastYear(eq(userId), any()))
			.thenReturn(BigDecimal.valueOf(6_000_000));
		when(accountRepository.sumMoneyAmountByUserId(userId)).thenReturn(BigDecimal.ZERO);
		when(accountBookRepository.sumAmountByUserIdAndCategoriesAndSpendDateTimeBetween(
			eq(userId), eq(List.of(com.mgk.bemgk.entity.AccountBookCategory.Hospital)), any(), any()))
			.thenReturn(BigDecimal.valueOf(200_000));
		when(accountBookRepository.sumAmountByUserIdAndCategoriesAndSpendDateTimeBetween(
			eq(userId), eq(List.of(com.mgk.bemgk.entity.AccountBookCategory.Food)), any(), any()))
			.thenReturn(BigDecimal.valueOf(400_000));
		when(accountBookRepository.countByUserIdAndCategoryAndSpendDateTimeBetween(
			eq(userId), eq(com.mgk.bemgk.entity.AccountBookCategory.Hospital), any(), any()))
			.thenReturn(2L);

		ProductPersonalizedReportResponse result = productService.getFeaturedPersonalizedProduct(userId);

		assertThat(result).isNotNull();
		assertThat(result.getProductType()).isEqualTo(ProductType.CARD);
		assertThat(result.getEstimatedMonthlyBenefit()).isEqualByComparingTo("10000");
		assertThat(result.getMaxAnnualBenefitAmount()).isEqualByComparingTo("480000");
	}

	@Test
	void getPersonalizedProductReports_setsInsuranceAnnualMaxToFourMillion() {
		Long userId = 1L;
		Product insurance = product("하나 펫보험", ProductType.INSURANCE, false, BigDecimal.valueOf(100_000), 20,
			null);

		when(productRepository.findAll()).thenReturn(List.of(insurance));
		when(petRepository.findByUser_Id(userId)).thenReturn(List.of());
		when(accountBookRepository.findFirstPetSpendDateByUserId(userId))
			.thenReturn(LocalDateTime.now().minusMonths(12));
		when(accountBookRepository.sumPetExpenseLastYear(eq(userId), any()))
			.thenReturn(BigDecimal.valueOf(1_200_000));
		when(accountRepository.sumMoneyAmountByUserId(userId)).thenReturn(BigDecimal.ZERO);
		when(accountBookRepository.sumAmountByUserIdAndCategoriesAndSpendDateTimeBetween(
			eq(userId), eq(List.of(com.mgk.bemgk.entity.AccountBookCategory.Hospital)), any(), any()))
			.thenReturn(BigDecimal.valueOf(600_000));
		when(accountBookRepository.sumAmountByUserIdAndCategoriesAndSpendDateTimeBetween(
			eq(userId), eq(List.of(com.mgk.bemgk.entity.AccountBookCategory.Food)), any(), any()))
			.thenReturn(BigDecimal.valueOf(100_000));
		when(accountBookRepository.countByUserIdAndCategoryAndSpendDateTimeBetween(
			eq(userId), eq(com.mgk.bemgk.entity.AccountBookCategory.Hospital), any(), any()))
			.thenReturn(8L);

		ProductPersonalizedReportResponse result = productService.getPersonalizedProductReports(userId).getFirst();

		assertThat(result.getEstimatedAnnualBenefit()).isEqualByComparingTo("800000");
		assertThat(result.getMaxAnnualBenefitAmount()).isEqualByComparingTo("4000000");
	}

	@Test
	void recommendationAndPersonalizedReports_coverSavingsSubscriptionAndPetForest() {
		Long userId = 2L;
		Product savings = product("하나 펫적금", ProductType.SAVINGS, false, null, null, BigDecimal.valueOf(168_000));
		ReflectionTestUtils.setField(savings, "benefitRate", BigDecimal.valueOf(2.8));
		Product subscription = product("하나 펫케어", ProductType.SUBSCRIPTION, false, BigDecimal.valueOf(15000), null, BigDecimal.valueOf(15000));
		Product petForest = product("하나 펫포레스트", ProductType.PET_FOREST, false, null, null, null);
		ReflectionTestUtils.setField(petForest, "benefitRate", BigDecimal.valueOf(20));
		Product activeInsurance = product("가입보험", ProductType.INSURANCE, true, BigDecimal.valueOf(100000), 20, BigDecimal.valueOf(4000000));

		Pet seniorPet = Pet.builder()
			.name("멩이")
			.species("고양이")
			.age(21.0)
			.death(false)
			.build();

		when(productRepository.findAll()).thenReturn(List.of(savings, subscription, petForest, activeInsurance));
		when(productRepository.findByIsActiveTrue()).thenReturn(List.of(activeInsurance));
		when(petRepository.findByUser_Id(userId)).thenReturn(List.of(seniorPet));
		when(accountBookRepository.findFirstPetSpendDateByUserId(userId)).thenReturn(LocalDateTime.now().minusMonths(13));
		when(accountBookRepository.sumPetExpenseLastYear(eq(userId), any())).thenReturn(BigDecimal.valueOf(2400000));
		when(accountRepository.sumMoneyAmountByUserId(userId)).thenReturn(BigDecimal.valueOf(1000000));
		when(accountBookRepository.sumAmountByUserIdAndCategoriesAndSpendDateTimeBetween(
			eq(userId), eq(List.of(com.mgk.bemgk.entity.AccountBookCategory.Hospital)), any(), any()))
			.thenReturn(BigDecimal.valueOf(100000));
		when(accountBookRepository.sumAmountByUserIdAndCategoriesAndSpendDateTimeBetween(
			eq(userId), eq(List.of(com.mgk.bemgk.entity.AccountBookCategory.Food)), any(), any()))
			.thenReturn(BigDecimal.valueOf(300000));
		when(accountBookRepository.countByUserIdAndCategoryAndSpendDateTimeBetween(
			eq(userId), eq(com.mgk.bemgk.entity.AccountBookCategory.Hospital), any(), any()))
			.thenReturn(1L);

		List<ProductRecommendationResponse> activeRecommendations = productService.getActiveProductRecommendations(userId);
		List<ProductPersonalizedReportResponse> reports = productService.getPersonalizedProductReports(userId);
		ProductPersonalizedReportResponse featured = productService.getFeaturedPersonalizedProduct(userId);

		assertThat(activeRecommendations).hasSize(1);
		assertThat(activeRecommendations.getFirst().getProductType()).isEqualTo(ProductType.INSURANCE);
		assertThat(reports).hasSize(3);
		assertThat(reports).noneMatch(report -> Boolean.TRUE.equals(report.getIsActive()));
		assertThat(reports.stream().map(ProductPersonalizedReportResponse::getProductType))
			.contains(ProductType.SAVINGS, ProductType.SUBSCRIPTION, ProductType.PET_FOREST);
		assertThat(reports.stream().filter(report -> report.getProductType() == ProductType.SAVINGS).findFirst().orElseThrow()
			.getEstimatedAnnualBenefit()).isEqualByComparingTo("168000");
		assertThat(reports.stream().filter(report -> report.getProductType() == ProductType.SUBSCRIPTION).findFirst().orElseThrow()
			.getEstimatedMonthlyBenefit()).isEqualByComparingTo("15000");
		assertThat(reports.stream().filter(report -> report.getProductType() == ProductType.PET_FOREST).findFirst().orElseThrow()
			.getPersonalizedReport()).contains("멩이");
		assertThat(featured).isNotNull();
		assertThat(featured.getProductType()).isIn(ProductType.PET_FOREST, ProductType.SUBSCRIPTION);
	}

	@Test
	void selectedYoungPet_doesNotRecommendPetForestEvenWhenAnotherSeniorPetExists() {
		Long userId = 3L;
		Product savings = product("하나 펫적금", ProductType.SAVINGS, false, null, null, BigDecimal.valueOf(168_000));
		ReflectionTestUtils.setField(savings, "benefitRate", BigDecimal.valueOf(2.8));
		Product subscription = product("하나 펫케어", ProductType.SUBSCRIPTION, false, BigDecimal.valueOf(15000), null, BigDecimal.valueOf(15000));
		Product petForest = product("하나 펫포레스트", ProductType.PET_FOREST, false, null, null, null);

		Pet seniorPet = Pet.builder()
			.name("노견이")
			.species("DOG")
			.age(16.0)
			.death(false)
			.build();
		ReflectionTestUtils.setField(seniorPet, "id", 10L);
		Pet youngPet = Pet.builder()
			.name("애기")
			.species("DOG")
			.age(1.0)
			.death(false)
			.build();
		ReflectionTestUtils.setField(youngPet, "id", 11L);

		when(productRepository.findAll()).thenReturn(List.of(savings, subscription, petForest));
		when(petRepository.findByUser_Id(userId)).thenReturn(List.of(seniorPet, youngPet));
		when(accountBookRepository.findFirstPetSpendDateByUserId(userId)).thenReturn(LocalDateTime.now().minusMonths(13));
		when(accountBookRepository.sumPetExpenseLastYear(eq(userId), any())).thenReturn(BigDecimal.valueOf(2400000));
		when(accountRepository.sumMoneyAmountByUserId(userId)).thenReturn(BigDecimal.valueOf(1000000));
		when(accountBookRepository.sumAmountByUserIdAndCategoriesAndSpendDateTimeBetween(
			eq(userId), eq(List.of(com.mgk.bemgk.entity.AccountBookCategory.Hospital)), any(), any()))
			.thenReturn(BigDecimal.valueOf(100000));
		when(accountBookRepository.sumAmountByUserIdAndCategoriesAndSpendDateTimeBetween(
			eq(userId), eq(List.of(com.mgk.bemgk.entity.AccountBookCategory.Food)), any(), any()))
			.thenReturn(BigDecimal.valueOf(300000));
		when(accountBookRepository.countByUserIdAndCategoryAndSpendDateTimeBetween(
			eq(userId), eq(com.mgk.bemgk.entity.AccountBookCategory.Hospital), any(), any()))
			.thenReturn(1L);

		List<ProductPersonalizedReportResponse> reports = productService.getPersonalizedProductReports(userId, 11L);
		ProductPersonalizedReportResponse featured = productService.getFeaturedPersonalizedProduct(userId, 11L);

		assertThat(reports.stream()
			.filter(report -> report.getProductType() == ProductType.PET_FOREST)
			.findFirst()
			.orElseThrow()
			.getEligible()).isFalse();
		assertThat(featured).isNotNull();
		assertThat(featured.getProductType()).isNotEqualTo(ProductType.PET_FOREST);
	}

	@Test
	void invalidSelectedPetId_fallsBackToWholeUserProfileInsteadOfThrowing() {
		Long userId = 4L;
		Product savings = product("하나 펫적금", ProductType.SAVINGS, false, null, null, BigDecimal.valueOf(168_000));
		Pet seniorPet = Pet.builder()
			.name("노견이")
			.species("DOG")
			.age(16.0)
			.death(false)
			.build();
		ReflectionTestUtils.setField(seniorPet, "id", 21L);

		when(productRepository.findAll()).thenReturn(List.of(savings));
		when(petRepository.findByUser_Id(userId)).thenReturn(List.of(seniorPet));
		when(accountBookRepository.findFirstPetSpendDateByUserId(userId))
			.thenReturn(LocalDateTime.now().minusMonths(12));
		when(accountBookRepository.sumPetExpenseLastYear(eq(userId), any()))
			.thenReturn(BigDecimal.valueOf(1_200_000));
		when(accountRepository.sumMoneyAmountByUserId(userId)).thenReturn(BigDecimal.ZERO);
		when(accountBookRepository.sumAmountByUserIdAndCategoriesAndSpendDateTimeBetween(
			eq(userId), eq(List.of(com.mgk.bemgk.entity.AccountBookCategory.Hospital)), any(), any()))
			.thenReturn(BigDecimal.valueOf(100_000));
		when(accountBookRepository.sumAmountByUserIdAndCategoriesAndSpendDateTimeBetween(
			eq(userId), eq(List.of(com.mgk.bemgk.entity.AccountBookCategory.Food)), any(), any()))
			.thenReturn(BigDecimal.valueOf(300_000));
		when(accountBookRepository.countByUserIdAndCategoryAndSpendDateTimeBetween(
			eq(userId), eq(com.mgk.bemgk.entity.AccountBookCategory.Hospital), any(), any()))
			.thenReturn(1L);

		List<ProductPersonalizedReportResponse> reports = productService.getPersonalizedProductReports(userId, 999L);

		assertThat(reports).hasSize(1);
	}

	private Product product(
		String name,
		ProductType type,
		boolean isActive,
		BigDecimal benefitAmount,
		Integer benefitLimitCount,
		BigDecimal benefitLimitAmount
	) {
		return Product.builder()
			.name(name)
			.productType(type)
			.description(name + " 설명")
			.url("https://example.com")
			.benefitAmount(benefitAmount)
			.benefitLimitCount(benefitLimitCount)
			.benefitLimitAmount(benefitLimitAmount)
			.sourceType(SourceType.ACCOUNT_BOOK)
			.isActive(isActive)
			.build();
	}
}
