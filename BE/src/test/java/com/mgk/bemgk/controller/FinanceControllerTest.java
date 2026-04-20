package com.mgk.bemgk.controller;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.mgk.bemgk.dto.finance.FinanceExpenseSummaryResponse;
import com.mgk.bemgk.dto.finance.FinanceDashboardResponse;
import com.mgk.bemgk.dto.finance.HomeSpendingSummaryResponse;
import com.mgk.bemgk.entity.AccountBook;
import com.mgk.bemgk.entity.AccountBookCategory;
import com.mgk.bemgk.service.CurrentUserService;
import com.mgk.bemgk.service.FinanceService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class FinanceControllerTest {

	private MockMvc mockMvc;

	@InjectMocks
	private FinanceController financeController;

	@Mock
	private FinanceService financeService;

	@Mock
	private CurrentUserService currentUserService;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(financeController).build();
	}

	@Test
	@DisplayName("GET /api/account-books/dashboard returns dashboard payload")
	void getDashboard_returnsDashboardPayload() throws Exception {
		when(currentUserService.getCurrentUserIdOrDefault()).thenReturn(1L);
		when(financeService.getDashboard(1L)).thenReturn(FinanceDashboardResponse.builder()
			.bankName("하나은행")
			.accountNumber("123-456")
			.balance(BigDecimal.valueOf(1_000_000))
			.build());

		mockMvc.perform(get("/api/account-books/dashboard"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.bankName").value("하나은행"))
			.andExpect(jsonPath("$.accountNumber").value("123-456"))
			.andExpect(jsonPath("$.balance").value(1000000));
	}

	@Test
	@DisplayName("GET /api/account-books/home-summary returns no content when summary missing")
	void getHomeSpendingSummary_returnsNoContentWhenMissing() throws Exception {
		when(currentUserService.getCurrentUserIdOrDefault()).thenReturn(1L);
		when(financeService.getHomeSpendingSummary(1L, 2026, 4, null)).thenReturn(Optional.empty());

		mockMvc.perform(get("/api/account-books/home-summary")
				.param("year", "2026")
				.param("month", "4"))
			.andExpect(status().isNoContent())
			.andExpect(content().string(""));
	}

	@Test
	@DisplayName("GET /api/account-books/home-summary returns home summary payload")
	void getHomeSpendingSummary_returnsSummaryPayload() throws Exception {
		when(currentUserService.getCurrentUserIdOrDefault()).thenReturn(1L);
		when(financeService.getHomeSpendingSummary(1L, 2026, 4, null))
			.thenReturn(Optional.of(HomeSpendingSummaryResponse.builder()
				.monthlyAmount(BigDecimal.valueOf(210_000))
				.primaryCategory("식비")
				.summary("에서 가장 많이 사용해요.")
				.savingsHint("구독 서비스를 이용하시면 매달 약 15,000원 정도 절약하실 수 있어요.")
				.build()));

		mockMvc.perform(get("/api/account-books/home-summary")
				.param("year", "2026")
				.param("month", "4"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.primaryCategory").value("식비"))
			.andExpect(jsonPath("$.summary").value("에서 가장 많이 사용해요."))
			.andExpect(jsonPath("$.savingsHint").value("구독 서비스를 이용하시면 매달 약 15,000원 정도 절약하실 수 있어요."));

		verify(financeService).getHomeSpendingSummary(1L, 2026, 4, null);
	}

	@Test
	@DisplayName("GET /api/account-books/home-summary forwards selected pet id")
	void getHomeSpendingSummary_withPetId_forwardsPetId() throws Exception {
		when(currentUserService.getCurrentUserIdOrDefault()).thenReturn(1L);
		when(financeService.getHomeSpendingSummary(1L, 2026, 4, 7L))
			.thenReturn(Optional.of(HomeSpendingSummaryResponse.builder()
				.monthlyAmount(BigDecimal.valueOf(210_000))
				.primaryCategory("식비")
				.summary("에서 가장 많이 사용해요.")
				.savingsHint("추천 문구")
				.build()));

		mockMvc.perform(get("/api/account-books/home-summary")
				.param("year", "2026")
				.param("month", "4")
				.param("petId", "7"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.savingsHint").value("추천 문구"));

		verify(financeService).getHomeSpendingSummary(1L, 2026, 4, 7L);
	}

	@Test
	@DisplayName("GET /api/account-books returns monthly summary payload")
	void getMonthlyExpenses_returnsSummaryPayload() throws Exception {
		when(currentUserService.getCurrentUserIdOrDefault()).thenReturn(1L);
		when(financeService.getMonthlyExpenses(1L, 2026, 4)).thenReturn(FinanceExpenseSummaryResponse.builder()
			.year(2026)
			.month(4)
			.monthlyExpense(BigDecimal.valueOf(210_000))
			.todayExpense(BigDecimal.valueOf(20_000))
			.items(java.util.List.of())
			.build());

		mockMvc.perform(get("/api/account-books")
				.param("year", "2026")
				.param("month", "4"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.monthlyExpense").value(210000))
			.andExpect(jsonPath("$.todayExpense").value(20000));
	}

	@Test
	@DisplayName("POST /api/account-books creates account book and DELETE removes it")
	void createAndDelete_delegateToService() throws Exception {
		when(currentUserService.getCurrentUserIdOrDefault()).thenReturn(1L);
		AccountBook accountBook = AccountBook.builder()
			.title("사료")
			.amount(BigDecimal.valueOf(15000))
			.category(AccountBookCategory.Food)
			.memo("메모")
			.spendDate(LocalDateTime.of(2026, 4, 16, 9, 0))
			.build();
		ReflectionTestUtils.setField(accountBook, "id", 3L);
		when(financeService.create(org.mockito.ArgumentMatchers.eq(1L), org.mockito.ArgumentMatchers.any()))
			.thenReturn(accountBook);

		mockMvc.perform(post("/api/account-books")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"title":"사료","amount":15000,"category":"Food","memo":"메모","spendDate":"2026-04-16T09:00:00"}
					"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.id").value(3))
			.andExpect(jsonPath("$.category").value("Food"));

		mockMvc.perform(delete("/api/account-books/3"))
			.andExpect(status().isNoContent());

		verify(financeService).delete(1L, 3L);
	}
}
