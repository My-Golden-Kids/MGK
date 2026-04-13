package com.mgk.bemgk.service;

import com.mgk.bemgk.dto.finance.CreateAccountBookRequest;
import com.mgk.bemgk.dto.finance.FinanceDashboardResponse;
import com.mgk.bemgk.dto.finance.FinanceExpenseItemResponse;
import com.mgk.bemgk.dto.finance.FinanceExpenseSummaryResponse;
import com.mgk.bemgk.dto.finance.HomeSpendingSummaryResponse;
import com.mgk.bemgk.entity.Account;
import com.mgk.bemgk.entity.AccountBook;
import com.mgk.bemgk.entity.AccountBookCategory;
import com.mgk.bemgk.entity.Product;
import com.mgk.bemgk.entity.ProductType;
import com.mgk.bemgk.entity.User;
import com.mgk.bemgk.repository.AccountBookRepository;
import com.mgk.bemgk.repository.AccountRepository;
import com.mgk.bemgk.repository.ProductRepository;
import com.mgk.bemgk.repository.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
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
    private static final Map<AccountBookCategory, String> HOME_CATEGORY_PRODUCT_LABEL = Map.of(
            AccountBookCategory.Hospital, "보험",
            AccountBookCategory.Etc, "적금",
            AccountBookCategory.Food, "구독"
    );
    private static final String HOME_CARD_SUMMARY_SUFFIX = "이 가장 잘 맞아요";
    private static final int DEFAULT_INSURANCE_LIMIT_COUNT = 20;
    private static final BigDecimal DEFAULT_INSURANCE_BENEFIT_AMOUNT = BigDecimal.valueOf(100000);
    private static final BigDecimal MANWON = BigDecimal.valueOf(10000);
    private static final String DEFAULT_SUBSCRIPTION_SAVINGS_LABEL = "1.5만원";

    private final AccountRepository accountRepository;
    private final AccountBookRepository accountBookRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

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

        return Optional.of(HomeSpendingSummaryResponse.builder()
                .monthlyAmount(sumAmount(monthlyExpenses))
                .primaryCategory(HOME_CATEGORY_PRODUCT_LABEL.get(category))
                .summary(HOME_CARD_SUMMARY_SUFFIX)
                .savingsHint(buildHomeSavingsHint(userId, yearMonth, category, monthlyExpenses))
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

    private String buildHomeSavingsHint(
            Long userId,
            YearMonth yearMonth,
            AccountBookCategory dominantCategory,
            List<AccountBook> monthlyExpenses
    ) {
        return switch (dominantCategory) {
            case Hospital -> buildInsuranceSavingsHint(userId, yearMonth, monthlyExpenses);
            case Etc -> buildSavingsProductHint();
            case Food -> "하나 펫 구독 가입하면, " + DEFAULT_SUBSCRIPTION_SAVINGS_LABEL + " 절약 가능";
        };
    }

    private String buildInsuranceSavingsHint(
            Long userId,
            YearMonth yearMonth,
            List<AccountBook> monthlyExpenses
    ) {
        Optional<Product> insuranceProduct = productRepository.findFirstByProductTypeAndIsActiveTrue(ProductType.INSURANCE);
        long monthlyHospitalCount = monthlyExpenses.stream()
                .filter(accountBook -> accountBook.getCategory() == AccountBookCategory.Hospital)
                .count();
        int annualLimitCount = insuranceProduct
                .map(Product::getBenefitLimitCount)
                .orElse(DEFAULT_INSURANCE_LIMIT_COUNT);
        long previousHospitalCount = countHospitalExpensesBeforeMonth(userId, yearMonth);
        long remainingCoveredCount = Math.max(annualLimitCount - previousHospitalCount, 0);
        long coveredCount = Math.min(monthlyHospitalCount, remainingCoveredCount);
        BigDecimal benefitAmount = insuranceProduct
                .map(Product::getBenefitAmount)
                .orElse(DEFAULT_INSURANCE_BENEFIT_AMOUNT);
        BigDecimal discountManwon = benefitAmount
                .multiply(BigDecimal.valueOf(coveredCount))
                .divide(MANWON, 1, RoundingMode.DOWN);

        return "하나 펫 보험 가입하면, " + formatDecimalText(discountManwon) + "만원 할인 가능";
    }

    private String buildSavingsProductHint() {
        Optional<Product> savingsProduct = productRepository.findFirstByProductTypeAndIsActiveTrue(ProductType.SAVINGS);

        return savingsProduct
                .map(Product::getBenefitRate)
                .map(rate -> "하나 펫 적금 가입하면, 연 " + formatDecimalText(rate) + "% 이자 가능")
                .orElse("하나 펫 적금 가입하면, 이자 혜택 확인 가능");
    }

    private long countHospitalExpensesBeforeMonth(Long userId, YearMonth yearMonth) {
        if (yearMonth.getMonthValue() == 1) {
            return 0;
        }

        Long count = accountBookRepository.countByUserIdAndCategoryAndSpendDateTimeBetween(
                userId,
                AccountBookCategory.Hospital,
                YearMonth.of(yearMonth.getYear(), 1).atDay(1).atStartOfDay(),
                resolveMonthStart(yearMonth).minusNanos(1)
        );

        return count == null ? 0 : count;
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

    private String formatDecimalText(BigDecimal value) {
        BigDecimal normalizedValue = value.stripTrailingZeros();

        if (normalizedValue.scale() < 0) {
            normalizedValue = normalizedValue.setScale(0);
        }

        return normalizedValue.toPlainString();
    }
}
