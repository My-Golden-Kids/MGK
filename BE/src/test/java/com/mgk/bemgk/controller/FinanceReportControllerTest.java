package com.mgk.bemgk.controller;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.mgk.bemgk.dto.finance.FinanceExpenseCategoryResponse;
import com.mgk.bemgk.dto.finance.FinanceMonthlyExpenseChartResponse;
import com.mgk.bemgk.dto.finance.FinanceReportResponse;
import com.mgk.bemgk.entity.User;
import com.mgk.bemgk.repository.UserRepository;
import com.mgk.bemgk.service.FinanceReportService;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class FinanceReportControllerTest {

	private MockMvc mockMvc;

	@InjectMocks
	private FinanceReportController financeReportController;

	@Mock
	private FinanceReportService financeReportService;

	@Mock
	private UserRepository userRepository;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(financeReportController).build();
	}

	@Test
	@DisplayName("GET /api/finance/report resolves numeric principal and returns report")
	void getRetirementReport_withNumericPrincipal_returnsReport() throws Exception {
		when(financeReportService.getRetirementReport(3L)).thenReturn(FinanceReportResponse.builder()
			.totalPetCost(BigDecimal.valueOf(29_910_000))
			.retirementPercent(BigDecimal.valueOf(2991.0))
			.averageExpense(BigDecimal.valueOf(125_000))
			.totalAsset(BigDecimal.valueOf(1_000_000))
			.dominantCategory(FinanceExpenseCategoryResponse.builder()
				.category("Food")
				.categoryLabel("식비")
				.amount(BigDecimal.valueOf(80_000))
				.percent(BigDecimal.valueOf(64.0))
				.build())
			.build());

		mockMvc.perform(get("/api/finance/report").with(authPrincipal(3L)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.dominantCategory.category").value("Food"))
			.andExpect(jsonPath("$.averageExpense").value(125000));
	}

	@Test
	@DisplayName("GET /api/finance/report resolves email principal via repository")
	void getRetirementReport_withEmailPrincipal_resolvesUserId() throws Exception {
		User user = User.builder()
			.name("테스터")
			.email("tester@example.com")
			.password("pw")
			.build();
		ReflectionTestUtils.setField(user, "id", 1L);

		when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));
		when(financeReportService.getRetirementReport(eq(1L))).thenReturn(FinanceReportResponse.builder()
			.averageExpense(BigDecimal.ZERO)
			.build());

		mockMvc.perform(get("/api/finance/report").with(authPrincipal("tester@example.com")))
			.andExpect(status().isOk());
	}

	@Test
	@DisplayName("GET /api/finance/report/monthly-expenses returns chart payload")
	void getMonthlyExpenses_returnsChartPayload() throws Exception {
		when(financeReportService.getMonthlyExpenseChart(2L))
			.thenReturn(FinanceMonthlyExpenseChartResponse.builder()
				.monthlyExpenses(List.of(FinanceMonthlyExpenseChartResponse.MonthlyExpenseItem.builder()
					.month("4월")
					.amount(BigDecimal.valueOf(120_000))
					.build()))
				.build());

		mockMvc.perform(get("/api/finance/report/monthly-expenses").with(authPrincipal(2L)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.monthlyExpenses[0].month").value("4월"))
			.andExpect(jsonPath("$.monthlyExpenses[0].amount").value(120000));
	}

	@Test
	@DisplayName("GET /api/finance/report returns 401 when authentication missing")
	void getRetirementReport_withoutAuthentication_returnsUnauthorized() throws Exception {
		mockMvc.perform(get("/api/finance/report"))
			.andExpect(status().isUnauthorized());
	}

	@Test
	@DisplayName("GET /api/finance/report returns 401 when email principal not found")
	void getRetirementReport_withUnknownEmail_returnsUnauthorized() throws Exception {
		when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

		mockMvc.perform(get("/api/finance/report").with(authPrincipal("missing@example.com")))
			.andExpect(status().isUnauthorized());
	}

	private RequestPostProcessor authPrincipal(Object principal) {
		return request -> {
			request.setUserPrincipal(new UsernamePasswordAuthenticationToken(principal, null, List.of()));
			return request;
		};
	}
}
