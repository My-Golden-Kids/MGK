package com.mgk.bemgk.service;

import com.mgk.bemgk.dto.product.ProductRecommendationResponse;
import com.mgk.bemgk.entity.Product;
import com.mgk.bemgk.entity.ProductType;
import com.mgk.bemgk.repository.AccountBookRepository;
import com.mgk.bemgk.repository.AccountRepository;
import com.mgk.bemgk.repository.ProductRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)

public class ProductService {

    private static final String HOSPITAL_CATEGORY = "병원";
    private static final BigDecimal ONE_HUNDRED = BigDecimal.valueOf(100);

    private final ProductRepository productRepository;
    private final AccountRepository accountRepository;
    private final AccountBookRepository accountBookRepository;

    // 활성화된 모든 상품에 대해 사용자 기준 예상 혜택 계산
    public List<ProductRecommendationResponse> getActiveProductRecommendations(Long userId) {
        return productRepository.findByIsActiveTrue()
                .stream()
                .map(product -> toRecommendation(userId, product))
                .toList();
    }

    // 상품 유형별 계산 메서드 분기
    private ProductRecommendationResponse toRecommendation(Long userId, Product product) {
        return switch (product.getProductType()) {
            case CARD -> calculateCardRecommendation(userId, product);
            case SAVINGS -> calculateSavingsRecommendation(userId, product);
            case INSURANCE -> calculateInsuranceRecommendation(userId, product);
        };
    }

    // 카드 : 이번 달 병원/쇼핑 지출 합계에 혜택 비율과 월 한도 적용
    private ProductRecommendationResponse calculateCardRecommendation(Long userId, Product product) {
        LocalDate now = LocalDate.now();
        LocalDate monthStart = now.withDayOfMonth(1);
        LocalDate monthEnd = now.withDayOfMonth(now.lengthOfMonth());
        List<String> categories = splitCategories(product.getTargetCategory());

        BigDecimal spendingAmount = categories.isEmpty()
                ? BigDecimal.ZERO
                : accountBookRepository.sumAmountByUserIdAndCategoriesAndSpendDateBetween(
                        userId, categories, monthStart, monthEnd);

        BigDecimal estimatedBenefit = calculateRateBenefit(spendingAmount, product.getBenefitRate());
        estimatedBenefit = capAmount(estimatedBenefit, product.getBenefitLimitAmount());

        return buildResponse(product, spendingAmount, null, estimatedBenefit);
    }

    // 적금 : 사용자의 계좌 잔액 총합에 적금 이율을 적용해 예상 이자 계산
    private ProductRecommendationResponse calculateSavingsRecommendation(Long userId, Product product) {
        BigDecimal moneyAmount = accountRepository.sumMoneyAmountByUserId(userId);
        BigDecimal estimatedInterest = calculateRateBenefit(moneyAmount, product.getBenefitRate());

        return buildResponse(product, moneyAmount, null, estimatedInterest);
    }

    // 보험 : 연간 병원 지출 건수를 기준으로 보험 보장 예상액 계산
    private ProductRecommendationResponse calculateInsuranceRecommendation(Long userId, Product product) {
        LocalDate now = LocalDate.now();
        LocalDate yearStart = now.withDayOfYear(1);
        LocalDate yearEnd = now.withDayOfYear(now.lengthOfYear());

        Long hospitalUsageCount = accountBookRepository.countByUserIdAndCategoryAndSpendDateBetween(
                userId, HOSPITAL_CATEGORY, yearStart, yearEnd);

        long coveredCount = Math.min(
                hospitalUsageCount == null ? 0L : hospitalUsageCount,
                product.getBenefitLimitCount() == null ? Long.MAX_VALUE : product.getBenefitLimitCount()
        );

        BigDecimal estimatedBenefit = (product.getBenefitAmount() == null)
                ? BigDecimal.ZERO
                : product.getBenefitAmount().multiply(BigDecimal.valueOf(coveredCount));

        return buildResponse(product, BigDecimal.ZERO, coveredCount, estimatedBenefit);
    }

    // 화면에 rendering해줄 추천 결과 DTO 공통 형식 구현
    private ProductRecommendationResponse buildResponse(Product product, BigDecimal sourceAmount,
                                                        Long usageCount, BigDecimal estimatedBenefitAmount) {
        return ProductRecommendationResponse.builder()
                .productId(product.getId())
                .productName(product.getName())
                .productType(product.getProductType())
                .description(product.getDescription())
                .sourceAmount(defaultAmount(sourceAmount))
                .usageCount(usageCount)
                .estimatedBenefitAmount(defaultAmount(estimatedBenefitAmount))
                .build();
    }

    // 금액에 퍼센트 비율을 적용해 예상 혜택 계산
    private BigDecimal calculateRateBenefit(BigDecimal sourceAmount, BigDecimal rate) {
        if (sourceAmount == null || rate == null) {
            return BigDecimal.ZERO;
        }
        return sourceAmount.multiply(rate)
                .divide(ONE_HUNDRED, 2, RoundingMode.DOWN);
    }

    // 상품에 최대 혜택 금액이 있으면 그 상한까지만 인정
    private BigDecimal capAmount(BigDecimal amount, BigDecimal maxAmount) {
        if (amount == null) {
            return BigDecimal.ZERO;
        }
        if (maxAmount == null) {
            return amount;
        }
        return amount.min(maxAmount);
    }

    // null 금액을 0원으로 통일
    private BigDecimal defaultAmount(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount;
    }

    // "병원,쇼핑"처럼 저장된 카테고리 문자열을 리스트로 분리
    private List<String> splitCategories(String targetCategory) {
        if (targetCategory == null || targetCategory.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(targetCategory.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .toList();
    }
}
