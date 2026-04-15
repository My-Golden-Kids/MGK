package com.mgk.bemgk.service;

import com.mgk.bemgk.dto.finance.CreateAccountBookRequest;
import com.mgk.bemgk.dto.finance.FinanceDashboardResponse;
import com.mgk.bemgk.dto.finance.FinanceExpenseItemResponse;
import com.mgk.bemgk.dto.finance.FinanceExpenseSummaryResponse;
import com.mgk.bemgk.dto.finance.HomeSpendingSummaryResponse;
import com.mgk.bemgk.dto.product.ProductPersonalizedReportResponse;
import com.mgk.bemgk.entity.Account;
import com.mgk.bemgk.entity.AccountBook;
import com.mgk.bemgk.entity.AccountBookCategory;
import com.mgk.bemgk.entity.User;
import com.mgk.bemgk.repository.AccountBookRepository;
import com.mgk.bemgk.repository.AccountRepository;
import com.mgk.bemgk.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.EnumMap;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class FinanceService {

    private static final String INITIAL_ACCOUNT_LINK_TITLE = "첫 계좌연결";
    private static final List<AccountBookCategory> HOME_CATEGORY_PRIORITY = List.of(
            AccountBookCategory.Hospital,
            AccountBookCategory.Etc,
            AccountBookCategory.Food
    );
    private static final BigDecimal MANWON = BigDecimal.valueOf(10000);

    private final AccountRepository accountRepository;
    private final AccountBookRepository accountBookRepository;
    private final UserRepository userRepository;
    private final ProductService productService;

    @Transactional(readOnly = true)
    public FinanceDashboardResponse getDashboard(Long userId) {
        Account account = accountRepository.findFirstByUser_IdOrderByIdAsc(userId)
                .orElseThrow(() -> new IllegalArgumentException("계좌 정보가 존재하지 않습니다."));

        return FinanceDashboardResponse.builder()
                .bankName(account.getBankName())
                .accountNumber(account.getAccountNumber())
                .balance(account.getMoneyAmount())
                .build();
    }

    public AccountBook create(Long userId, CreateAccountBookRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자가 존재하지 않습니다."));

        AccountBook accountBook = AccountBook.builder()
                .user(user)
                .title(request.getTitle().trim())
                .amount(request.getAmount())
                .category(request.getCategory())
                .memo(request.getMemo() == null ? null : request.getMemo().trim())
                .spendDate(request.getSpendDate())
                .build();

        return accountBookRepository.save(accountBook);
    }

    public void delete(Long userId, Long accountBookId) {
        AccountBook accountBook = accountBookRepository.findById(accountBookId)
                .orElseThrow(() -> new IllegalArgumentException("지출 내역이 존재하지 않습니다."));

        if (!accountBook.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("삭제할 수 없는 지출 내역입니다.");
        }

        accountBookRepository.delete(accountBook);
    }

    @Transactional(readOnly = true)
    public FinanceExpenseSummaryResponse getMonthlyExpenses(Long userId, int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate today = LocalDate.now();

        List<AccountBook> monthlyExpenses = findMonthlyExpenseEntities(userId, yearMonth);

        List<FinanceExpenseItemResponse> items = monthlyExpenses
                .stream()
                .map(FinanceExpenseItemResponse::from)
                .toList();

        BigDecimal monthlyExpense = monthlyExpenses.stream()
                .map(AccountBook::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal todayExpense = BigDecimal.ZERO;
        if (today.getYear() == year && today.getMonthValue() == month) {
            todayExpense = monthlyExpenses.stream()
                    .filter(accountBook -> accountBook.getSpendDate().toLocalDate().isEqual(today))
                    .map(AccountBook::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        return FinanceExpenseSummaryResponse.builder()
                .year(year)
                .month(month)
                .monthlyExpense(monthlyExpense)
                .todayExpense(todayExpense)
                .items(items)
                .build();
    }

    @Transactional(readOnly = true)
    public Optional<HomeSpendingSummaryResponse> getHomeSpendingSummary(Long userId, int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        List<AccountBook> monthlyExpenses = findMonthlyExpenseEntities(userId, yearMonth);
        Optional<AccountBookCategory> dominantCategory = findDominantHomeCategory(monthlyExpenses);

        if (dominantCategory.isEmpty()) {
            return Optional.empty();
        }

        AccountBookCategory category = dominantCategory.get();
        ProductPersonalizedReportResponse recommendedProduct =
                productService.getFeaturedPersonalizedProduct(userId);

        return Optional.of(HomeSpendingSummaryResponse.builder()
                .monthlyAmount(sumAmount(monthlyExpenses))
                .primaryCategory(toCategoryLabel(category))
                .summary("에서 가장 많이 사용해요.")
                .savingsHint(buildHomeRecommendationHint(recommendedProduct))
                .build());
    }

    private List<AccountBook> findMonthlyExpenseEntities(Long userId, YearMonth yearMonth) {
        return accountBookRepository
                .findMonthlyExpensesByUserId(userId, resolveMonthStart(yearMonth), resolveMonthEnd(yearMonth))
                .stream()
                .filter(accountBook -> !INITIAL_ACCOUNT_LINK_TITLE.equals(accountBook.getTitle()))
                .toList();
    }

    private Optional<AccountBookCategory> findDominantHomeCategory(List<AccountBook> monthlyExpenses) {
        EnumMap<AccountBookCategory, BigDecimal> totals = new EnumMap<>(AccountBookCategory.class);
        HOME_CATEGORY_PRIORITY.forEach(category -> totals.put(category, BigDecimal.ZERO));

        monthlyExpenses.forEach(accountBook ->
                totals.computeIfPresent(
                        accountBook.getCategory(),
                        (category, amount) -> amount.add(accountBook.getAmount())
                )
        );

        AccountBookCategory dominantCategory = HOME_CATEGORY_PRIORITY.stream()
                .reduce(HOME_CATEGORY_PRIORITY.get(0), (currentBest, category) ->
                        totals.get(category).compareTo(totals.get(currentBest)) > 0 ? category : currentBest
                );

        return totals.get(dominantCategory).compareTo(BigDecimal.ZERO) > 0
                ? Optional.of(dominantCategory)
                : Optional.empty();
    }

    private String buildHomeRecommendationHint(ProductPersonalizedReportResponse recommendedProduct) {
        if (recommendedProduct == null) {
            return "추천 상품 정보를 준비 중이에요.";
        }

        return switch (recommendedProduct.getProductType()) {
            case INSURANCE -> recommendedProduct.getProductName() + "에 가입하시면 연간 약 "
                    + toCurrencyText(recommendedProduct.getEstimatedAnnualBenefit()) + " 정도 의료비를 아끼실 수 있어요.";
            case CARD -> recommendedProduct.getProductName() + "를 이용하시면 매달 약 "
                    + toCurrencyText(recommendedProduct.getEstimatedMonthlyBenefit()) + " 정도 절약하실 수 있어요.";
            case SUBSCRIPTION -> "구독 서비스를 이용하시면 매달 약 "
                    + toCurrencyText(recommendedProduct.getEstimatedMonthlyBenefit()) + " 정도 절약하실 수 있어요.";
            case SAVINGS -> recommendedProduct.getProductName() + "에 가입하시면 매년 약 "
                    + toCurrencyText(recommendedProduct.getEstimatedAnnualBenefit()) + "의 이자를 받아보실 수 있어요.";
            case PET_FOREST -> buildPetForestHomeHint(recommendedProduct.getPersonalizedReport());
        };
    }

    private String buildPetForestHomeHint(String personalizedReport) {
        if (personalizedReport != null) {
            int nameEndIndex = personalizedReport.indexOf("의 마지막 순간");
            if (nameEndIndex > 0) {
                String petName = personalizedReport.substring(0, nameEndIndex).trim();
                if (!petName.isBlank() && !"반려동물".equals(petName)) {
                    return "우리 " + petName + "와의 마지막 순간을 펫포레스트와 함께 준비해보세요.";
                }
            }
        }

        return "우리 아이와의 마지막 순간을 펫포레스트와 함께 준비해보세요.";
    }

    private BigDecimal sumAmount(List<AccountBook> accountBooks) {
        return accountBooks.stream()
                .map(AccountBook::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private LocalDateTime resolveMonthStart(YearMonth yearMonth) {
        return yearMonth.atDay(1).atStartOfDay();
    }

    private LocalDateTime resolveMonthEnd(YearMonth yearMonth) {
        return yearMonth.plusMonths(1).atDay(1).atStartOfDay().minusNanos(1);
    }

    private String toCategoryLabel(AccountBookCategory category) {
        return switch (category) {
            case Hospital -> "의료비";
            case Food -> "식비";
            case Etc -> "기타";
        };
    }

    private String toManwonText(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return "0원";
        }

        BigDecimal manwon = amount.divide(MANWON, 1, java.math.RoundingMode.DOWN);
        return formatDecimalText(manwon) + "만원";
    }

    private String toCurrencyText(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return "0원";
        }

        return String.format("%,d원", amount.setScale(0, java.math.RoundingMode.HALF_UP).longValue());
    }

    private String formatDecimalText(BigDecimal value) {
        BigDecimal normalizedValue = value.stripTrailingZeros();

        if (normalizedValue.scale() < 0) {
            normalizedValue = normalizedValue.setScale(0);
        }

        return normalizedValue.toPlainString();
    }
}
