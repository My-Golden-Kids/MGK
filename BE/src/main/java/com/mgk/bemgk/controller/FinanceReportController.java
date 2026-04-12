package com.mgk.bemgk.controller;

import com.mgk.bemgk.dto.finance.FinanceMonthlyExpenseChartResponse;
import com.mgk.bemgk.dto.finance.FinanceReportResponse;
import com.mgk.bemgk.service.FinanceReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/finance/report")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class FinanceReportController {

	private final FinanceReportService financeReportService;

	@GetMapping
	public FinanceReportResponse getRetirementReport(
		@RequestParam Long userId
	) {
		return financeReportService.getRetirementReport(userId);
	}

	@GetMapping("/monthly-expenses")
	public FinanceMonthlyExpenseChartResponse getMonthlyExpenses(
		@RequestParam Long userId
	) {
		return financeReportService.getMonthlyExpenseChart(userId);
	}
}