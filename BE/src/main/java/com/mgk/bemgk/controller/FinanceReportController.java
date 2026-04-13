package com.mgk.bemgk.controller;

import com.mgk.bemgk.dto.finance.FinanceMonthlyExpenseChartResponse;
import com.mgk.bemgk.dto.finance.FinanceReportResponse;
import com.mgk.bemgk.entity.User;
import com.mgk.bemgk.repository.UserRepository;
import com.mgk.bemgk.service.FinanceReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/finance/report")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class FinanceReportController {

	private final FinanceReportService financeReportService;
	private final UserRepository userRepository;

	@GetMapping
	public FinanceReportResponse getRetirementReport(Authentication authentication) {
		Long userId = getCurrentUserId(authentication);
		return financeReportService.getRetirementReport(userId);
	}

	@GetMapping("/monthly-expenses")
	public FinanceMonthlyExpenseChartResponse getMonthlyExpenses(Authentication authentication) {
		Long userId = getCurrentUserId(authentication);
		return financeReportService.getMonthlyExpenseChart(userId);
	}

	private Long getCurrentUserId(Authentication authentication) {
		if (authentication == null || !authentication.isAuthenticated()) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
		}

		String email = authentication.getName();
		User user = userRepository.findByEmail(email).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용자를 찾을 수 없습니다."));

		return user.getId();
	}
}