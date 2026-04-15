package com.mgk.bemgk.service;

import com.mgk.bemgk.dto.product.ProductPersonalizedReportResponse;
import com.mgk.bemgk.dto.product.ProductRecommendationResponse;
import com.mgk.bemgk.dto.product.ProductTypeResolver;
import com.mgk.bemgk.entity.AccountBookCategory;
import com.mgk.bemgk.entity.Pet;
import com.mgk.bemgk.entity.Product;
import com.mgk.bemgk.entity.ProductType;
import com.mgk.bemgk.repository.AccountBookRepository;
import com.mgk.bemgk.repository.AccountRepository;
import com.mgk.bemgk.repository.PetRepository;
import com.mgk.bemgk.repository.ProductRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.ThreadLocalRandom;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private static final BigDecimal THIRTY_MAN_WON = BigDecimal.valueOf(300_000);
    private static final BigDecimal SIXTY_MAN_WON = BigDecimal.valueOf(600_000);
    private static final BigDecimal ONE_MILLION_WON = BigDecimal.valueOf(1_000_000);
    private static final BigDecimal TEN_THOUSAND_WON = BigDecimal.valueOf(10_000);
    private static final BigDecimal TWENTY_THOUSAND_WON = BigDecimal.valueOf(20_000);
    private static final BigDecimal FORTY_THOUSAND_WON = BigDecimal.valueOf(40_000);
    private static final BigDecimal INSURANCE_MAX_ANNUAL_BENEFIT = BigDecimal.valueOf(4_000_000);
    private static final BigDecimal ONE_HUNDRED = BigDecimal.valueOf(100);
    private static final BigDecimal TWELVE = BigDecimal.valueOf(12);

    private final ProductRepository productRepository;
    private final AccountRepository accountRepository;
    private final AccountBookRepository accountBookRepository;
    private final PetRepository petRepository;

    public List<Product> getProducts() {
        return productRepository.findAll();
    }

    public Product getProduct(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품이 존재하지 않습니다."));
    }

    public List<ProductRecommendationResponse> getActiveProductRecommendations(Long userId) {
        return productRepository.findByIsActiveTrue()
                .stream()
                .map(product -> toRecommendation(userId, product))
                .toList();
    }

    public List<ProductPersonalizedReportResponse> getPersonalizedProductReports(Long userId) {
        UserProductProfile profile = buildUserProfile(userId);
        Product featured = chooseFeaturedProduct(profile);

        return getProducts().stream()
                .filter(product -> !Boolean.TRUE.equals(product.getIsActive()))
                .map(product -> toPersonalizedReport(product, profile, featured))
                .toList();
    }

    public ProductPersonalizedReportResponse getFeaturedPersonalizedProduct(Long userId) {
        UserProductProfile profile = buildUserProfile(userId);
        Product featured = chooseFeaturedProduct(profile);
        if (featured == null) {
            return null;
        }
        return toPersonalizedReport(featured, profile, featured);
    }

    private ProductRecommendationResponse toRecommendation(Long userId, Product product) {
        return switch (ProductTypeResolver.resolve(product)) {
            case CARD -> calculateCardRecommendation(userId, product);
            case SAVINGS, SUBSCRIPTION, PET_FOREST -> calculateSavingsRecommendation(userId, product);
            case INSURANCE -> calculateInsuranceRecommendation(userId, product);
        };
    }

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
        estimatedBenefit = capAmount(estimatedBenefit, resolveCardMonthlyLimit(product));

        return buildResponse(product, spendingAmount, null, estimatedBenefit);
    }

    private ProductRecommendationResponse calculateSavingsRecommendation(Long userId, Product product) {
        BigDecimal moneyAmount = accountRepository.sumMoneyAmountByUserId(userId);
        BigDecimal estimatedInterest = calculateRateBenefit(moneyAmount, product.getBenefitRate());

        return buildResponse(product, moneyAmount, null, estimatedInterest);
    }

    private ProductRecommendationResponse calculateInsuranceRecommendation(Long userId, Product product) {
        LocalDate now = LocalDate.now();
        LocalDate yearStart = now.withDayOfYear(1);
        LocalDate yearEnd = now.withDayOfYear(now.lengthOfYear());

        Long hospitalUsageCount = accountBookRepository.countByUserIdAndCategoryAndSpendDateBetween(
                userId, AccountBookCategory.Hospital.name(), yearStart, yearEnd);

        long coveredCount = Math.min(
                hospitalUsageCount == null ? 0L : hospitalUsageCount,
                product.getBenefitLimitCount() == null ? Long.MAX_VALUE : product.getBenefitLimitCount()
        );

        BigDecimal estimatedBenefit = (product.getBenefitAmount() == null)
                ? BigDecimal.ZERO
                : product.getBenefitAmount().multiply(BigDecimal.valueOf(coveredCount));

        return buildResponse(product, BigDecimal.ZERO, coveredCount, estimatedBenefit);
    }

    private ProductRecommendationResponse buildResponse(
            Product product,
            BigDecimal sourceAmount,
            Long usageCount,
            BigDecimal estimatedBenefitAmount
    ) {
        return ProductRecommendationResponse.builder()
                .productId(product.getId())
                .productName(product.getName())
                .productType(ProductTypeResolver.resolve(product))
                .description(product.getDescription())
                .sourceAmount(defaultAmount(sourceAmount))
                .usageCount(usageCount)
                .estimatedBenefitAmount(defaultAmount(estimatedBenefitAmount))
                .build();
    }

    private ProductPersonalizedReportResponse toPersonalizedReport(
            Product product,
            UserProductProfile profile,
            Product featured
    ) {
        ProductType resolvedType = ProductTypeResolver.resolve(product);
        boolean eligible = isEligible(product, resolvedType, profile);
        boolean recommended = featured != null && Objects.equals(featured.getId(), product.getId());
        BigDecimal estimatedMonthlyBenefit = calculateEstimatedMonthlyBenefit(product, resolvedType, profile);
        BigDecimal estimatedAnnualBenefit = calculateEstimatedAnnualBenefit(product, resolvedType, profile);

        return ProductPersonalizedReportResponse.builder()
                .productId(product.getId())
                .productName(product.getName())
                .productType(resolvedType)
                .recommendationType(resolvedType.name())
                .description(product.getDescription())
                .url(product.getUrl())
                .isActive(product.getIsActive())
                .benefitRate(product.getBenefitRate())
                .benefitAmount(product.getBenefitAmount())
                .benefitLimitAmount(product.getBenefitLimitAmount())
                .benefitLimitCount(product.getBenefitLimitCount())
                .benefitPeriod(product.getBenefitPeriod() == null ? null : product.getBenefitPeriod().name())
                .targetCategory(product.getTargetCategory())
                .sourceType(product.getSourceType() == null ? null : product.getSourceType().name())
                .eligible(eligible)
                .recommendedForFinanceReport(recommended)
                .recommendationReason(buildRecommendationReason(resolvedType, profile))
                .personalizedReport(buildPersonalizedReport(product, resolvedType, profile, estimatedMonthlyBenefit, estimatedAnnualBenefit))
                .averageMonthlyExpense(profile.averageMonthlyExpense.setScale(0, RoundingMode.HALF_UP))
                .hospitalExpense(profile.hospitalExpense.setScale(0, RoundingMode.HALF_UP))
                .foodExpense(profile.foodExpense.setScale(0, RoundingMode.HALF_UP))
                .hospitalVisitCount(profile.hospitalVisitCount)
                .estimatedMonthlyBenefit(estimatedMonthlyBenefit.setScale(0, RoundingMode.HALF_UP))
                .estimatedAnnualBenefit(estimatedAnnualBenefit.setScale(0, RoundingMode.HALF_UP))
                .maxMonthlyBenefitAmount(resolveMaxMonthlyBenefitAmount(product, resolvedType, profile))
                .maxAnnualBenefitAmount(resolveMaxAnnualBenefitAmount(product, resolvedType, profile))
                .build();
    }

    private Product chooseFeaturedProduct(UserProductProfile profile) {
        List<Product> products = getProducts().stream()
                .filter(product -> !Boolean.TRUE.equals(product.getIsActive()))
                .toList();
        Product insurance = findProduct(products, ProductType.INSURANCE, false);
        Product savings = findProduct(products, ProductType.SAVINGS, false);
        Product card = findProduct(products, ProductType.CARD, false);
        Product subscription = findProduct(products, ProductType.SUBSCRIPTION, false);
        Product petForest = findProduct(products, ProductType.PET_FOREST, false);

        if (profile.hasSeniorPet) {
            Product primary = choosePrimaryBySpending(profile, insurance, card, subscription);
            return chooseRandom(compactProducts(petForest, primary));
        }

        if (profile.averageMonthlyExpense.compareTo(THIRTY_MAN_WON) < 0) {
            if (profile.hospitalExpense.compareTo(profile.foodExpense) >= 0) {
                return chooseRandom(compactProducts(insurance, savings));
            }
            return chooseRandom(compactProducts(subscription, savings));
        }

        if (profile.hospitalExpense.compareTo(profile.foodExpense.multiply(BigDecimal.valueOf(2))) > 0) {
            return chooseRandom(compactProducts(insurance, savings));
        }

        return card;
    }

    private Product choosePrimaryBySpending(
            UserProductProfile profile,
            Product insurance,
            Product card,
            Product subscription
    ) {
        if (profile.averageMonthlyExpense.compareTo(THIRTY_MAN_WON) < 0) {
            return profile.hospitalExpense.compareTo(profile.foodExpense) >= 0 ? insurance : subscription;
        }
        if (profile.hospitalExpense.compareTo(profile.foodExpense.multiply(BigDecimal.valueOf(2))) > 0) {
            return insurance;
        }
        return card;
    }

    private Product findProduct(List<Product> products, ProductType type, Boolean isActive) {
        return products.stream()
                .filter(product -> ProductTypeResolver.resolve(product) == type)
                .filter(product -> isActive == null || Objects.equals(product.getIsActive(), isActive))
                .findFirst()
                .orElse(null);
    }

    private List<Product> compactProducts(Product first, Product second) {
        List<Product> products = new ArrayList<>();
        if (first != null) {
            products.add(first);
        }
        if (second != null && !Objects.equals(first == null ? null : first.getId(), second.getId())) {
            products.add(second);
        }
        return products;
    }

    private Product chooseRandom(List<Product> candidates) {
        if (candidates.isEmpty()) {
            return null;
        }
        return candidates.get(ThreadLocalRandom.current().nextInt(candidates.size()));
    }

    private boolean isEligible(Product product, ProductType type, UserProductProfile profile) {
        return switch (type) {
            case INSURANCE -> isInsuranceCondition(profile);
            case CARD -> profile.averageMonthlyExpense.compareTo(THIRTY_MAN_WON) >= 0
                    && profile.hospitalExpense.compareTo(profile.foodExpense.multiply(BigDecimal.valueOf(2))) <= 0;
            case SAVINGS -> !profile.hasSeniorPet;
            case SUBSCRIPTION -> profile.averageMonthlyExpense.compareTo(THIRTY_MAN_WON) < 0
                    && profile.hospitalExpense.compareTo(profile.foodExpense) < 0;
            case PET_FOREST -> profile.hasSeniorPet;
        };
    }

    private boolean isInsuranceCondition(UserProductProfile profile) {
        if (profile.averageMonthlyExpense.compareTo(THIRTY_MAN_WON) < 0) {
            return profile.hospitalExpense.compareTo(profile.foodExpense) >= 0;
        }
        return profile.hospitalExpense.compareTo(profile.foodExpense.multiply(BigDecimal.valueOf(2))) > 0;
    }

    private BigDecimal calculateEstimatedMonthlyBenefit(Product product, ProductType type, UserProductProfile profile) {
        return switch (type) {
            case INSURANCE -> calculateInsuranceAnnualBenefit(product, profile).divide(TWELVE, 2, RoundingMode.DOWN);
            case CARD -> calculateCardMonthlyBenefit(product, profile.averageMonthlyExpense);
            case SAVINGS -> calculateSavingsAnnualBenefit(product, profile).divide(TWELVE, 2, RoundingMode.DOWN);
            case SUBSCRIPTION -> calculateSubscriptionMonthlyBenefit(product, profile.averageMonthlyExpense);
            case PET_FOREST -> BigDecimal.ZERO;
        };
    }

    private BigDecimal calculateEstimatedAnnualBenefit(Product product, ProductType type, UserProductProfile profile) {
        return switch (type) {
            case INSURANCE -> calculateInsuranceAnnualBenefit(product, profile);
            case CARD -> calculateCardMonthlyBenefit(product, profile.averageMonthlyExpense).multiply(TWELVE);
            case SAVINGS -> calculateSavingsAnnualBenefit(product, profile);
            case SUBSCRIPTION -> calculateSubscriptionMonthlyBenefit(product, profile.averageMonthlyExpense).multiply(TWELVE);
            case PET_FOREST -> BigDecimal.ZERO;
        };
    }

    private BigDecimal calculateInsuranceAnnualBenefit(Product product, UserProductProfile profile) {
        long coveredCount = product.getBenefitLimitCount() == null
                ? profile.hospitalVisitCount
                : Math.min(profile.hospitalVisitCount, product.getBenefitLimitCount());

        BigDecimal estimated = defaultAmount(product.getBenefitAmount())
                .multiply(BigDecimal.valueOf(coveredCount));

        return capAmount(estimated, resolveInsuranceAnnualLimitAmount(product));
    }

    private BigDecimal calculateCardMonthlyBenefit(Product product, BigDecimal averageMonthlyExpense) {
        if (averageMonthlyExpense.compareTo(ONE_MILLION_WON) >= 0) {
            return FORTY_THOUSAND_WON;
        }
        if (averageMonthlyExpense.compareTo(SIXTY_MAN_WON) >= 0) {
            return TWENTY_THOUSAND_WON;
        }
        if (averageMonthlyExpense.compareTo(THIRTY_MAN_WON) >= 0) {
            return TEN_THOUSAND_WON;
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal calculateSavingsAnnualBenefit(Product product, UserProductProfile profile) {
        if (product.getBenefitLimitAmount() != null) {
            return product.getBenefitLimitAmount();
        }

        BigDecimal fixedPrincipal = BigDecimal.valueOf(500_000).multiply(TWELVE);
        BigDecimal estimated = calculateRateBenefit(fixedPrincipal, product.getBenefitRate());
        return estimated.setScale(0, RoundingMode.DOWN);
    }

    private BigDecimal calculateSubscriptionMonthlyBenefit(Product product, BigDecimal averageMonthlyExpense) {
        if (product.getBenefitAmount() != null) {
            return defaultAmount(product.getBenefitAmount());
        }
        BigDecimal estimated = calculateRateBenefit(averageMonthlyExpense, product.getBenefitRate());
        return capAmount(estimated, product.getBenefitLimitAmount());
    }

    private BigDecimal resolveAnnualLimitAmount(Product product) {
        if (product.getBenefitLimitAmount() != null) {
            return product.getBenefitLimitAmount();
        }
        if (product.getBenefitAmount() != null && product.getBenefitLimitCount() != null) {
            return product.getBenefitAmount().multiply(BigDecimal.valueOf(product.getBenefitLimitCount()));
        }
        return null;
    }

    private BigDecimal resolveInsuranceAnnualLimitAmount(Product product) {
        return INSURANCE_MAX_ANNUAL_BENEFIT;
    }

    private BigDecimal resolveCardMonthlyLimit(Product product) {
        return product.getBenefitLimitAmount() == null ? FORTY_THOUSAND_WON : product.getBenefitLimitAmount();
    }

    private BigDecimal resolveMaxMonthlyBenefitAmount(
            Product product,
            ProductType type,
            UserProductProfile profile
    ) {
        return switch (type) {
            case INSURANCE, PET_FOREST -> BigDecimal.ZERO;
            case CARD -> resolveCardMonthlyLimit(product);
            case SAVINGS -> calculateSavingsAnnualBenefit(product, profile).divide(TWELVE, 2, RoundingMode.DOWN);
            case SUBSCRIPTION -> defaultAmount(product.getBenefitAmount());
        };
    }

    private BigDecimal resolveMaxAnnualBenefitAmount(
            Product product,
            ProductType type,
            UserProductProfile profile
    ) {
        return switch (type) {
            case INSURANCE -> {
                BigDecimal resolved = resolveInsuranceAnnualLimitAmount(product);
                yield defaultAmount(resolved);
            }
            case CARD -> resolveCardMonthlyLimit(product).multiply(TWELVE);
            case SAVINGS -> calculateSavingsAnnualBenefit(product, profile);
            case SUBSCRIPTION -> defaultAmount(product.getBenefitAmount()).multiply(TWELVE);
            case PET_FOREST -> BigDecimal.ZERO;
        };
    }

    private String buildRecommendationReason(ProductType type, UserProductProfile profile) {
        return switch (type) {
            case INSURANCE -> "월평균 지출과 병원비 비중을 기준으로 보험이 우선 추천됩니다.";
            case CARD -> "월평균 지출이 30만원 이상이라 카드형 혜택 체감이 가장 큽니다.";
            case SAVINGS -> "기본 대비용 상품으로 적금을 함께 고려할 수 있습니다.";
            case SUBSCRIPTION -> "식비 비중이 더 높아 구독형 상품이 잘 맞습니다.";
            case PET_FOREST -> "기준 나이에 도달한 반려동물이 있어 펫포레스트를 함께 제안합니다.";
        };
    }

    private String buildPersonalizedReport(
            Product product,
            ProductType type,
            UserProductProfile profile,
            BigDecimal estimatedMonthlyBenefit,
            BigDecimal estimatedAnnualBenefit
    ) {
        return switch (type) {
            case INSURANCE -> String.format(
                    "최근 1년 동안 병원을 %d번 이용했어요. %s에 가입하시면 연간 약 %,d원의 의료비 절감이 가능해요. 또한 연 최대 %,d원까지 보장 혜택을 받을 수 있어요.",
                    profile.hospitalVisitCount,
                    product.getName(),
                    estimatedAnnualBenefit.setScale(0, RoundingMode.HALF_UP).longValue(),
                    defaultAmount(resolveAnnualLimitAmount(product)).setScale(0, RoundingMode.HALF_UP).longValue()
            );
            case CARD -> String.format(
                    "%s를 이용하시면 현재 지출 기준으로 매달 약 %,d원을 절약하실 수 있어요. 연간으로는 약 %,d원 혜택을 기대할 수 있습니다.",
                    product.getName(),
                    estimatedMonthlyBenefit.setScale(0, RoundingMode.HALF_UP).longValue(),
                    estimatedAnnualBenefit.setScale(0, RoundingMode.HALF_UP).longValue()
            );
            case SAVINGS -> String.format(
                    "반려동물을 위해 매달 50만원씩 저축하시면 %s으로 최대 연 %,d원의 이자 혜택을 받을 수 있어요.",
                    product.getName(),
                    estimatedAnnualBenefit.setScale(0, RoundingMode.HALF_UP).longValue()
            );
            case SUBSCRIPTION -> String.format(
                    "%s를 이용하시면 매달 약 %,d원을 아끼실 수 있어요. 연간으로는 약 %,d원 혜택을 기대할 수 있습니다.",
                    product.getName(),
                    estimatedMonthlyBenefit.setScale(0, RoundingMode.HALF_UP).longValue(),
                    estimatedAnnualBenefit.setScale(0, RoundingMode.HALF_UP).longValue()
            );
            case PET_FOREST -> String.format(
                    "%s의 마지막 순간을 %s와 함께 차분히 준비해보세요.%s",
                    profile.seniorPetName == null ? "반려동물" : profile.seniorPetName,
                    product.getName(),
                    product.getBenefitRate() == null
                            ? ""
                            : String.format(" 이용 시 %.0f%% 할인 혜택으로 부담을 덜 수 있어요.", product.getBenefitRate())
            );
        };
    }

    private UserProductProfile buildUserProfile(Long userId) {
        List<Pet> pets = petRepository.findByUser_Id(userId);
        List<Pet> alivePets = pets.stream()
                .filter(this::isAliveToday)
                .toList();

        LocalDate today = LocalDate.now();
        LocalDateTime startDateTime = today.minusYears(1).withDayOfMonth(1).atStartOfDay();
        LocalDateTime endDateTime = today.withDayOfMonth(today.lengthOfMonth()).atTime(23, 59, 59);

        Pet seniorPet = alivePets.stream()
                .filter(this::isSeniorPet)
                .findFirst()
                .orElse(null);

        return UserProductProfile.builder()
                .averageMonthlyExpense(calculateAverageMonthlyExpense(userId))
                .totalAsset(defaultAmount(accountRepository.sumMoneyAmountByUserId(userId)))
                .hospitalExpense(defaultAmount(accountBookRepository.sumAmountByUserIdAndCategoriesAndSpendDateTimeBetween(
                        userId,
                        List.of(AccountBookCategory.Hospital),
                        startDateTime,
                        endDateTime
                )))
                .foodExpense(defaultAmount(accountBookRepository.sumAmountByUserIdAndCategoriesAndSpendDateTimeBetween(
                        userId,
                        List.of(AccountBookCategory.Food),
                        startDateTime,
                        endDateTime
                )))
                .hospitalVisitCount(defaultCount(accountBookRepository.countByUserIdAndCategoryAndSpendDateTimeBetween(
                        userId,
                        AccountBookCategory.Hospital,
                        startDateTime,
                        endDateTime
                )))
                .hasSeniorPet(seniorPet != null)
                .seniorPetName(seniorPet == null ? null : seniorPet.getName())
                .build();
    }

    private BigDecimal calculateAverageMonthlyExpense(Long userId) {
        LocalDateTime firstSpendDateTime = accountBookRepository.findFirstPetSpendDateByUserId(userId);
        if (firstSpendDateTime == null) {
            return BigDecimal.ZERO;
        }

        YearMonth firstSpendMonth = YearMonth.from(firstSpendDateTime);
        YearMonth currentMonth = YearMonth.now();
        long observedMonths = ChronoUnit.MONTHS.between(firstSpendMonth, currentMonth) + 1;
        if (observedMonths <= 0) {
            return BigDecimal.ZERO;
        }

        if (observedMonths < 12) {
            BigDecimal totalExpense = defaultAmount(accountBookRepository.sumPetExpenseByUserId(userId));
            return totalExpense.divide(BigDecimal.valueOf(observedMonths), 2, RoundingMode.HALF_UP);
        }

        LocalDateTime oneYearAgoStart = currentMonth.minusMonths(11).atDay(1).atStartOfDay();
        BigDecimal lastYearExpense = defaultAmount(accountBookRepository.sumPetExpenseLastYear(userId, oneYearAgoStart));
        return lastYearExpense.divide(TWELVE, 2, RoundingMode.HALF_UP);
    }

    private boolean isAliveToday(Pet pet) {
        return !pet.isDead();
    }

    private boolean isSeniorPet(Pet pet) {
        if (pet.getAge() == null) {
            return false;
        }
        return BigDecimal.valueOf(pet.getAge()).compareTo(getLifeExpectancyYears(pet)) >= 0;
    }

    private BigDecimal getLifeExpectancyYears(Pet pet) {
        String species = safeLower(pet.getSpecies());
        String size = pet.getSize() == null ? "" : pet.getSize().name().toLowerCase();

        if (species.contains("고양이") || species.contains("cat")) {
            return BigDecimal.valueOf(20);
        }

        return switch (size) {
            case "small", "소형" -> BigDecimal.valueOf(15);
            case "medium", "중형" -> BigDecimal.valueOf(13);
            case "large", "대형" -> BigDecimal.valueOf(12);
            default -> BigDecimal.valueOf(13);
        };
    }

    private BigDecimal calculateRateBenefit(BigDecimal sourceAmount, BigDecimal rate) {
        if (sourceAmount == null || rate == null) {
            return BigDecimal.ZERO;
        }
        return sourceAmount.multiply(rate)
                .divide(ONE_HUNDRED, 2, RoundingMode.DOWN);
    }

    private BigDecimal capAmount(BigDecimal amount, BigDecimal maxAmount) {
        if (amount == null) {
            return BigDecimal.ZERO;
        }
        if (maxAmount == null) {
            return amount;
        }
        return amount.min(maxAmount);
    }

    private BigDecimal defaultAmount(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount;
    }

    private long defaultCount(Long value) {
        return value == null ? 0L : value;
    }

    private List<String> splitCategories(String targetCategory) {
        if (targetCategory == null || targetCategory.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(targetCategory.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .toList();
    }

    private String safeLower(String value) {
        return value == null ? "" : value.toLowerCase();
    }

    @Builder
    private record UserProductProfile(
            BigDecimal averageMonthlyExpense,
            BigDecimal totalAsset,
            BigDecimal hospitalExpense,
            BigDecimal foodExpense,
            long hospitalVisitCount,
            boolean hasSeniorPet,
            String seniorPetName
    ) {
    }
}
