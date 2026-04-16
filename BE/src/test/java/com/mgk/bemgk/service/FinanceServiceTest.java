package com.mgk.bemgk.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.mgk.bemgk.dto.finance.CreateAccountBookRequest;
import com.mgk.bemgk.dto.finance.FinanceDashboardResponse;
import com.mgk.bemgk.dto.finance.FinanceExpenseSummaryResponse;
import com.mgk.bemgk.dto.finance.HomeSpendingSummaryResponse;
import com.mgk.bemgk.dto.product.ProductPersonalizedReportResponse;
import com.mgk.bemgk.entity.Account;
import com.mgk.bemgk.entity.AccountBook;
import com.mgk.bemgk.entity.AccountBookCategory;
import com.mgk.bemgk.entity.ProductType;
import com.mgk.bemgk.entity.User;
import com.mgk.bemgk.repository.AccountBookRepository;
import com.mgk.bemgk.repository.AccountRepository;
import com.mgk.bemgk.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FinanceServiceTest {

	@Mock
	private AccountRepository accountRepository;

	@Mock
	private AccountBookRepository accountBookRepository;

	@Mock
	private UserRepository userRepository;

	@Mock
	private ProductService productService;

	@InjectMocks
	private FinanceService financeService;

	@Test
	void getHomeSpendingSummary_buildsCategoryAndSubscriptionHint() {
		Long userId = 1L;
		YearMonth currentMonth = YearMonth.now();
		AccountBook foodExpense = AccountBook.builder()
			.title("사료")
			.amount(BigDecimal.valueOf(120_000))
			.category(AccountBookCategory.Food)
			.spendDate(LocalDateTime.now())
			.build();
		AccountBook hospitalExpense = AccountBook.builder()
			.title("병원")
			.amount(BigDecimal.valueOf(10_000))
			.category(AccountBookCategory.Hospital)
			.spendDate(LocalDateTime.now())
			.build();

		when(accountBookRepository.findMonthlyExpensesByUserId(eq(userId), any(), any()))
			.thenReturn(List.of(foodExpense, hospitalExpense));
		when(productService.getFeaturedPersonalizedProduct(userId))
			.thenReturn(ProductPersonalizedReportResponse.builder()
				.productType(ProductType.SUBSCRIPTION)
				.estimatedMonthlyBenefit(BigDecimal.valueOf(15_000))
				.build());

		Optional<HomeSpendingSummaryResponse> result =
			financeService.getHomeSpendingSummary(userId, currentMonth.getYear(), currentMonth.getMonthValue());

		assertThat(result).isPresent();
		assertThat(result.get().getPrimaryCategory()).isEqualTo("식비");
		assertThat(result.get().getSummary()).isEqualTo("에서 가장 많이 사용해요.");
		assertThat(result.get().getSavingsHint()).isEqualTo("구독 서비스를 이용하시면 매달 약 15,000원 정도 절약하실 수 있어요.");
	}

	@Test
	void getHomeSpendingSummary_buildsPetForestHintWithPetName() {
		Long userId = 1L;
		YearMonth currentMonth = YearMonth.now();
		AccountBook etcExpense = AccountBook.builder()
			.title("기타")
			.amount(BigDecimal.valueOf(80_000))
			.category(AccountBookCategory.Etc)
			.spendDate(LocalDateTime.now())
			.build();

		when(accountBookRepository.findMonthlyExpensesByUserId(eq(userId), any(), any()))
			.thenReturn(List.of(etcExpense));
		when(productService.getFeaturedPersonalizedProduct(userId))
			.thenReturn(ProductPersonalizedReportResponse.builder()
				.productType(ProductType.PET_FOREST)
				.personalizedReport("멩이의 마지막 순간을 펫포레스트와 함께 차분히 준비해보세요.")
				.build());

		Optional<HomeSpendingSummaryResponse> result =
			financeService.getHomeSpendingSummary(userId, currentMonth.getYear(), currentMonth.getMonthValue());

		assertThat(result).isPresent();
		assertThat(result.get().getSavingsHint()).isEqualTo("우리 멩이와의 마지막 순간을 펫포레스트와 함께 준비해보세요.");
	}

	@Test
	void dashboardCreateDeleteAndMonthlyExpenses_workAsExpected() {
		Account account = Account.builder()
			.bankName("하나은행")
			.accountNumber("123-456")
			.moneyAmount(BigDecimal.valueOf(1000000))
			.build();
		User user = User.builder().name("tester").email("t@test.com").password("pw").build();
		org.springframework.test.util.ReflectionTestUtils.setField(user, "id", 1L);

		AccountBook todayExpense = AccountBook.builder()
			.user(user)
			.title("병원비")
			.amount(BigDecimal.valueOf(50000))
			.category(AccountBookCategory.Hospital)
			.memo("검진")
			.spendDate(LocalDateTime.now())
			.build();
		org.springframework.test.util.ReflectionTestUtils.setField(todayExpense, "id", 9L);

		CreateAccountBookRequest request = new CreateAccountBookRequest();
		org.springframework.test.util.ReflectionTestUtils.setField(request, "title", " 사료 ");
		org.springframework.test.util.ReflectionTestUtils.setField(request, "amount", BigDecimal.valueOf(20000));
		org.springframework.test.util.ReflectionTestUtils.setField(request, "category", AccountBookCategory.Food);
		org.springframework.test.util.ReflectionTestUtils.setField(request, "memo", " 건식 ");
		org.springframework.test.util.ReflectionTestUtils.setField(request, "spendDate", LocalDateTime.now());

		when(accountRepository.findFirstByUser_IdOrderByIdAsc(1L)).thenReturn(Optional.of(account));
		when(userRepository.findById(1L)).thenReturn(Optional.of(user));
		when(accountBookRepository.save(any(AccountBook.class))).thenAnswer(invocation -> invocation.getArgument(0));
		when(accountBookRepository.findById(9L)).thenReturn(Optional.of(todayExpense));
		when(accountBookRepository.findMonthlyExpensesByUserId(eq(1L), any(), any()))
			.thenReturn(List.of(todayExpense));

		FinanceDashboardResponse dashboard = financeService.getDashboard(1L);
		AccountBook created = financeService.create(1L, request);
		FinanceExpenseSummaryResponse monthlyExpenses = financeService.getMonthlyExpenses(
			1L,
			YearMonth.now().getYear(),
			YearMonth.now().getMonthValue()
		);
		financeService.delete(1L, 9L);

		assertThat(dashboard.getBankName()).isEqualTo("하나은행");
		assertThat(created.getTitle()).isEqualTo("사료");
		assertThat(created.getMemo()).isEqualTo("건식");
		assertThat(monthlyExpenses.getMonthlyExpense()).isEqualByComparingTo("50000");
		assertThat(monthlyExpenses.getTodayExpense()).isEqualByComparingTo("50000");
		assertThat(monthlyExpenses.getItems()).hasSize(1);
	}

	@Test
	void homeSummary_returnsEmptyAndHandlesNullRecommendation() {
		when(accountBookRepository.findMonthlyExpensesByUserId(eq(1L), any(), any()))
			.thenReturn(List.of());

		Optional<HomeSpendingSummaryResponse> empty =
			financeService.getHomeSpendingSummary(1L, YearMonth.now().getYear(), YearMonth.now().getMonthValue());

		assertThat(empty).isEmpty();

		AccountBook hospitalExpense = AccountBook.builder()
			.title("병원")
			.amount(BigDecimal.valueOf(10000))
			.category(AccountBookCategory.Hospital)
			.spendDate(LocalDateTime.now())
			.build();
		when(accountBookRepository.findMonthlyExpensesByUserId(eq(1L), any(), any()))
			.thenReturn(List.of(hospitalExpense));
		when(productService.getFeaturedPersonalizedProduct(1L)).thenReturn(null);

		Optional<HomeSpendingSummaryResponse> result =
			financeService.getHomeSpendingSummary(1L, YearMonth.now().getYear(), YearMonth.now().getMonthValue());

		assertThat(result).isPresent();
		assertThat(result.get().getPrimaryCategory()).isEqualTo("의료비");
		assertThat(result.get().getSavingsHint()).isEqualTo("추천 상품 정보를 준비 중이에요.");
	}
}
