package com.mgk.bemgk.dto.finance;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.mgk.bemgk.dto.product.ProductPersonalizedReportResponse;
import com.mgk.bemgk.entity.AccountBook;
import com.mgk.bemgk.entity.AccountBookCategory;

class FinanceDtosTest {

	@Test
	void financeDtosExposeValuesAndStaticMappings() {
		LocalDateTime spendDate = LocalDateTime.of(2026, 4, 16, 10, 0);
		AccountBook accountBook = AccountBook.builder()
			.title("병원비")
			.amount(BigDecimal.valueOf(50000))
			.category(AccountBookCategory.Hospital)
			.memo("검진")
			.spendDate(spendDate)
			.build();
		ReflectionTestUtils.setField(accountBook, "id", 10L);

		CreateAccountBookRequest request = new CreateAccountBookRequest();
		ReflectionTestUtils.setField(request, "title", "사료");
		ReflectionTestUtils.setField(request, "amount", BigDecimal.valueOf(30000));
		ReflectionTestUtils.setField(request, "category", AccountBookCategory.Food);
		ReflectionTestUtils.setField(request, "memo", "건식");
		ReflectionTestUtils.setField(request, "spendDate", spendDate);

		AccountBookResponse accountBookResponse = AccountBookResponse.from(accountBook);
		FinanceExpenseItemResponse itemResponse = FinanceExpenseItemResponse.from(accountBook);
		FinanceExpenseCategoryResponse categoryResponse = FinanceExpenseCategoryResponse.builder()
			.category("Hospital")
			.categoryLabel("의료비")
			.amount(BigDecimal.valueOf(50000))
			.percent(BigDecimal.valueOf(62.5))
			.build();
		FinanceMonthlyExpenseChartResponse.MonthlyExpenseItem chartItem =
			FinanceMonthlyExpenseChartResponse.MonthlyExpenseItem.builder()
				.month("2026-04")
				.amount(BigDecimal.valueOf(120000))
				.build();
		FinanceMonthlyExpenseChartResponse chartResponse = FinanceMonthlyExpenseChartResponse.builder()
			.monthlyExpenses(List.of(chartItem))
			.build();
		FinanceExpenseSummaryResponse summaryResponse = FinanceExpenseSummaryResponse.builder()
			.year(2026)
			.month(4)
			.monthlyExpense(BigDecimal.valueOf(120000))
			.todayExpense(BigDecimal.valueOf(50000))
			.items(List.of(itemResponse))
			.build();
		FinanceDashboardResponse dashboardResponse = FinanceDashboardResponse.builder()
			.bankName("하나은행")
			.accountNumber("123-456")
			.balance(BigDecimal.valueOf(1000000))
			.build();
		HomeSpendingSummaryResponse homeSpendingSummaryResponse = HomeSpendingSummaryResponse.builder()
			.monthlyAmount(BigDecimal.valueOf(120000))
			.primaryCategory("의료비")
			.summary("에서 가장 많이 사용해요.")
			.savingsHint("보험에 가입하시면 연간 약 80만원 정도 의료비를 아끼실 수 있어요.")
			.build();
		FinanceReportResponse financeReportResponse = FinanceReportResponse.builder()
			.retirementPercent(BigDecimal.valueOf(20))
			.totalPetCost(BigDecimal.valueOf(2000000))
			.averageExpense(BigDecimal.valueOf(125000))
			.totalAsset(BigDecimal.valueOf(1000000))
			.dominantCategory(categoryResponse)
			.expenseCategory(categoryResponse)
			.recommendedProduct(ProductPersonalizedReportResponse.builder().productName("보험").build())
			.build();

		assertThat(request.getTitle()).isEqualTo("사료");
		assertThat(request.getAmount()).isEqualByComparingTo("30000");
		assertThat(request.getCategory()).isEqualTo(AccountBookCategory.Food);
		assertThat(request.getMemo()).isEqualTo("건식");
		assertThat(request.getSpendDate()).isEqualTo(spendDate);
		assertThat(accountBookResponse.getId()).isEqualTo(10L);
		assertThat(accountBookResponse.getAmount()).isEqualByComparingTo("50000");
		assertThat(itemResponse.getCategory()).isEqualTo(AccountBookCategory.Hospital);
		assertThat(categoryResponse.getCategoryLabel()).isEqualTo("의료비");
		assertThat(categoryResponse.getPercent()).isEqualByComparingTo("62.5");
		assertThat(chartItem.getMonth()).isEqualTo("2026-04");
		assertThat(chartResponse.getMonthlyExpenses()).containsExactly(chartItem);
		assertThat(summaryResponse.getItems()).containsExactly(itemResponse);
		assertThat(dashboardResponse.getBankName()).isEqualTo("하나은행");
		assertThat(homeSpendingSummaryResponse.getPrimaryCategory()).isEqualTo("의료비");
		assertThat(financeReportResponse.getDominantCategory()).isSameAs(categoryResponse);
		assertThat(financeReportResponse.getExpenseCategory()).isSameAs(categoryResponse);
		assertThat(financeReportResponse.getRecommendedProduct().getProductName()).isEqualTo("보험");
	}
}
