package com.mgk.bemgk.dto.finance;

// 월별 지출 내역에 필요한 합계와 항목 목록 응답

import java.math.BigDecimal;
import java.util.List;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FinanceExpenseSummaryResponse {

	private int year;
	private int month;
	private BigDecimal monthlyExpense;
	private BigDecimal todayExpense;
	private List<FinanceExpenseItemResponse> items;
}
