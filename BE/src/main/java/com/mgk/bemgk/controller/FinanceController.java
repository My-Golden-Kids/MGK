package com.mgk.bemgk.controller;

import com.mgk.bemgk.dto.finance.AccountBookResponse;
import com.mgk.bemgk.dto.finance.CreateAccountBookRequest;
import com.mgk.bemgk.dto.finance.FinanceExpenseSummaryResponse;
import com.mgk.bemgk.entity.AccountBook;
import com.mgk.bemgk.service.CurrentUserService;
import com.mgk.bemgk.service.FinanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/account-books")
@CrossOrigin(origins = "http://localhost:3000")
public class FinanceController {

    private final FinanceService financeService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public FinanceExpenseSummaryResponse getMonthlyExpenses(
            @RequestParam int year,
            @RequestParam int month
    ) {
        Long userId = currentUserService.getCurrentUserIdOrDefault();

        return financeService.getMonthlyExpenses(userId, year, month);
    }

    @DeleteMapping("/{accountBookId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long accountBookId) {
        Long userId = currentUserService.getCurrentUserIdOrDefault();

        financeService.delete(userId, accountBookId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AccountBookResponse create(@RequestBody @Valid CreateAccountBookRequest request) {
        Long userId = currentUserService.getCurrentUserIdOrDefault();

        AccountBook accountBook = financeService.create(userId, request);
        return AccountBookResponse.from(accountBook);
    }
}
