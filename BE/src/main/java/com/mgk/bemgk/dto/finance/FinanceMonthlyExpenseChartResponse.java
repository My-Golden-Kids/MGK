package com.mgk.bemgk.dto.finance;

import java.math.BigDecimal;
import java.util.List;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FinanceMonthlyExpenseChartResponse {

	private List<MonthlyExpenseItem> monthlyExpenses;

	@Getter
	@Builder
	public static class MonthlyExpenseItem {
		private String month;
		private BigDecimal amount;
	}
}
