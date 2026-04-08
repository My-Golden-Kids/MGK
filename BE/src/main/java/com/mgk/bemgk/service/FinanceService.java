package com.mgk.bemgk.service;

import com.mgk.bemgk.dto.finance.FinanceExpenseItemResponse;
import com.mgk.bemgk.dto.finance.FinanceExpenseSummaryResponse;
import com.mgk.bemgk.dto.finance.CreateAccountBookRequest;
import com.mgk.bemgk.entity.AccountBook;
import com.mgk.bemgk.entity.User;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import com.mgk.bemgk.repository.AccountBookRepository;
import com.mgk.bemgk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class FinanceService {

    private final AccountBookRepository accountBookRepository;
    private final UserRepository userRepository;

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

    @Transactional(readOnly = true)
    public FinanceExpenseSummaryResponse getMonthlyExpenses(Long userId, int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDateTime monthStart = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime monthEnd = yearMonth.atEndOfMonth().atTime(23, 59, 59);
        LocalDate today = LocalDate.now();

        List<FinanceExpenseItemResponse> items = accountBookRepository
                .findMonthlyExpensesByUserId(userId, monthStart, monthEnd)
                .stream()
                .map(FinanceExpenseItemResponse::from)
                .toList();

        BigDecimal monthlyExpense = accountBookRepository.sumAmountByUserIdAndSpendDateTimeBetween(
                userId, monthStart, monthEnd);

        BigDecimal todayExpense = BigDecimal.ZERO;
        if (today.getYear() == year && today.getMonthValue() == month) {
            LocalDateTime todayStart = today.atStartOfDay();
            LocalDateTime todayEnd = today.atTime(23, 59, 59);
            todayExpense = accountBookRepository.sumAmountByUserIdAndSpendDateTimeBetween(
                    userId, todayStart, todayEnd);
        }

        return FinanceExpenseSummaryResponse.builder()
                .year(year)
                .month(month)
                .monthlyExpense(monthlyExpense)
                .todayExpense(todayExpense)
                .items(items)
                .build();
    }
}
