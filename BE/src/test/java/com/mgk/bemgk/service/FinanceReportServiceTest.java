package com.mgk.bemgk.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import com.mgk.bemgk.dto.finance.FinanceMonthlyExpenseChartResponse;
import com.mgk.bemgk.dto.finance.FinanceReportResponse;
import com.mgk.bemgk.dto.product.ProductPersonalizedReportResponse;
import com.mgk.bemgk.entity.AccountBook;
import com.mgk.bemgk.entity.AccountBookCategory;
import com.mgk.bemgk.entity.Pet;
import com.mgk.bemgk.entity.PetSize;
import com.mgk.bemgk.repository.AccountBookRepository;
import com.mgk.bemgk.repository.AccountRepository;
import com.mgk.bemgk.repository.PetRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Map;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class FinanceReportServiceTest {

	@Mock
	private PetRepository petRepository;

	@Mock
	private AccountBookRepository accountBookRepository;

	@Mock
	private AccountRepository accountRepository;

	@Mock
	private ProductService productService;

	@InjectMocks
	private FinanceReportService financeReportService;

	@Test
	void getRetirementReport_usesFoodAsDominantCategoryAndExposesBothFields() {
		Long userId = 1L;
		AccountBook foodExpense = AccountBook.builder()
			.title("사료")
			.amount(BigDecimal.valueOf(200_000))
			.category(AccountBookCategory.Food)
			.spendDate(LocalDateTime.now())
			.build();
		AccountBook hospitalExpense = AccountBook.builder()
			.title("병원")
			.amount(BigDecimal.valueOf(50_000))
			.category(AccountBookCategory.Hospital)
			.spendDate(LocalDateTime.now())
			.build();

		when(petRepository.findByUser_Id(userId)).thenReturn(List.of());
		when(accountRepository.sumTotalAmountByUserId(userId)).thenReturn(BigDecimal.ZERO);
		when(accountBookRepository.findMonthlyExpensesByUserId(eq(userId), any(), any()))
			.thenReturn(List.of(foodExpense, hospitalExpense));
		when(productService.getFeaturedPersonalizedProduct(userId, null))
			.thenReturn(ProductPersonalizedReportResponse.builder().productId(10L).productName("하나 펫카드").build());

		FinanceReportResponse result = financeReportService.getRetirementReport(userId);

		assertThat(result.getDominantCategory()).isNotNull();
		assertThat(result.getDominantCategory().getCategory()).isEqualTo("Food");
		assertThat(result.getDominantCategory().getCategoryLabel()).isEqualTo("식비");
		assertThat(result.getDominantCategory().getPercent()).isEqualByComparingTo("80.0");
		assertThat(result.getExpenseCategory()).isNotNull();
		assertThat(result.getExpenseCategory().getCategory()).isEqualTo("Food");
	}

	@Test
	void monthlyChartAndPrivateHelpers_coverAgeAndDeathBranches() {
		Long userId = 1L;
		Pet dog = Pet.builder()
			.name("멍이")
			.species("DOG")
			.age(3.0)
			.size(PetSize.중형)
			.death(true)
			.deathDate(LocalDateTime.now().minusMonths(1))
			.build();
		Pet cat = Pet.builder()
			.name("냥이")
			.species("고양이")
			.age(10.0)
			.size(null)
			.death(false)
			.build();
		ReflectionTestUtils.setField(dog, "createdAt", LocalDateTime.now().minusMonths(12));
		ReflectionTestUtils.setField(cat, "createdAt", LocalDateTime.now().minusMonths(12));

		when(accountBookRepository.sumMonthlyPetExpenseByUserId(eq(userId), any(), any()))
			.thenReturn(List.of(
				new Object[] {YearMonth.now().getYear(), YearMonth.now().getMonthValue(), "125000"},
				new Object[] {YearMonth.now().minusMonths(1).getYear(), YearMonth.now().minusMonths(1).getMonthValue(), 50000}
			));
		when(petRepository.findByUser_Id(userId)).thenReturn(List.of(dog, cat));
		lenient().when(accountBookRepository.findFirstPetSpendDateByUserId(userId)).thenReturn(LocalDateTime.now().minusMonths(12));
		lenient().when(accountBookRepository.sumPetExpenseLastYear(eq(userId), any())).thenReturn(BigDecimal.valueOf(1200000));
		lenient().when(accountRepository.sumTotalAmountByUserId(userId)).thenReturn(BigDecimal.valueOf(1000000));
		lenient().when(accountBookRepository.findMonthlyExpensesByUserId(eq(userId), any(), any())).thenReturn(List.of());
		lenient().when(productService.getFeaturedPersonalizedProduct(userId, null)).thenReturn(null);

		FinanceMonthlyExpenseChartResponse chart = financeReportService.getMonthlyExpenseChart(userId);
		FinanceReportResponse report = financeReportService.getRetirementReport(userId);
		BigDecimal dogLife = financeReportService.getLifeExpectancyYears(dog);
		BigDecimal catLife = financeReportService.getLifeExpectancyYears(cat);
		@SuppressWarnings("unchecked")
		Map<YearMonth, BigDecimal> monthlyMap = ReflectionTestUtils.invokeMethod(
			financeReportService,
			"getMonthlyExpenseMap",
			userId,
			YearMonth.now().minusMonths(1),
			YearMonth.now()
		);
		Integer activePetsThisMonth = ReflectionTestUtils.invokeMethod(
			financeReportService,
			"countActivePetsForMonth",
			List.of(dog, cat),
			YearMonth.now()
		);

		assertThat(chart.getMonthlyExpenses()).hasSize(12);
		assertThat(chart.getMonthlyExpenses().getLast().getAmount()).isEqualByComparingTo("125000");
		assertThat(report.getAverageExpense()).isEqualByComparingTo("14583");
		assertThat(dogLife).isEqualByComparingTo("13.0");
		assertThat(catLife).isEqualByComparingTo("20.0");
		assertThat(monthlyMap).containsKeys(YearMonth.now().minusMonths(1), YearMonth.now());
		assertThat(activePetsThisMonth).isEqualTo(1);
	}

	@Test
	void monthlyAverageExpense_doesNotDropBackfilledExpenseMonthsBeforePetCreatedAt() {
		Long userId = 3L;
		Pet pet = Pet.builder()
			.name("멩이")
			.species("DOG")
			.age(4.0)
			.size(PetSize.중형)
			.death(false)
			.build();
		ReflectionTestUtils.setField(pet, "createdAt", LocalDateTime.now());

		when(petRepository.findByUser_Id(userId)).thenReturn(List.of(pet));
		when(accountBookRepository.findFirstPetSpendDateByUserId(userId)).thenReturn(LocalDateTime.of(2026, 2, 1, 0, 0));
		when(accountBookRepository.sumMonthlyPetExpenseByUserId(eq(userId), any(), any()))
			.thenReturn(List.of(
				new Object[] {2026, 2, 85800},
				new Object[] {2026, 3, 125000},
				new Object[] {2026, 4, 640000}
			));
		when(accountRepository.sumTotalAmountByUserId(userId)).thenReturn(BigDecimal.ZERO);
		when(accountBookRepository.findMonthlyExpensesByUserId(eq(userId), any(), any())).thenReturn(List.of());
		when(productService.getFeaturedPersonalizedProduct(userId, null)).thenReturn(null);

		FinanceReportResponse report = financeReportService.getRetirementReport(userId);

		assertThat(report.getAverageExpense()).isEqualByComparingTo("283600");
	}

	@Test
	void futurePetCost_splitsUserMonthlyAverageAcrossAlivePets() {
		Long userId = 4L;
		Pet firstDog = Pet.builder()
			.name("첫째")
			.species("DOG")
			.age(13.0)
			.size(PetSize.소형)
			.death(false)
			.build();
		Pet secondDog = Pet.builder()
			.name("둘째")
			.species("DOG")
			.age(11.0)
			.size(PetSize.소형)
			.death(false)
			.build();

		when(petRepository.findByUser_Id(userId)).thenReturn(List.of(firstDog, secondDog));
		when(accountBookRepository.findFirstPetSpendDateByUserId(userId)).thenReturn(LocalDateTime.of(2026, 2, 1, 0, 0));
		when(accountBookRepository.sumMonthlyPetExpenseByUserId(eq(userId), any(), any()))
			.thenReturn(List.of(
				new Object[] {2026, 2, 800000},
				new Object[] {2026, 3, 800000},
				new Object[] {2026, 4, 800000}
			));
		when(accountRepository.sumTotalAmountByUserId(userId)).thenReturn(BigDecimal.ZERO);
		when(accountBookRepository.findMonthlyExpensesByUserId(eq(userId), any(), any())).thenReturn(List.of());
		when(productService.getFeaturedPersonalizedProduct(userId, null)).thenReturn(null);

		FinanceReportResponse report = financeReportService.getRetirementReport(userId);

		assertThat(report.getAverageExpense()).isEqualByComparingTo("800000");
		assertThat(report.getTotalPetCost()).isEqualByComparingTo("40200000");
	}

	@Test
	void projectedMonthlyExpensePerPet_weightsMonthsByActivePetCountChanges() {
		Long userId = 5L;
		List<Pet> pets = new ArrayList<>();
		for (int i = 0; i < 4; i++) {
			pets.add(Pet.builder()
				.name("생존-" + i)
				.species("DOG")
				.age(5.0)
				.size(PetSize.소형)
				.death(false)
				.build());
		}
		pets.add(Pet.builder()
			.name("무지개")
			.species("DOG")
			.age(5.0)
			.size(PetSize.소형)
			.death(true)
			.deathDate(YearMonth.now().minusMonths(2).atDay(15).atStartOfDay())
			.build());

		List<Object[]> monthlyExpenses = new ArrayList<>();
		YearMonth startMonth = YearMonth.now().minusMonths(11);
		for (int i = 0; i < 12; i++) {
			YearMonth month = startMonth.plusMonths(i);
			monthlyExpenses.add(new Object[] {month.getYear(), month.getMonthValue(), 500000});
		}

		when(accountBookRepository.findFirstPetSpendDateByUserId(userId))
			.thenReturn(startMonth.atDay(1).atStartOfDay());
		when(accountBookRepository.sumMonthlyPetExpenseByUserId(eq(userId), any(), any()))
			.thenReturn(monthlyExpenses);

		BigDecimal result = ReflectionTestUtils.invokeMethod(
			financeReportService,
			"calculateProjectedMonthlyExpensePerPet",
			userId,
			pets
		);

		assertThat(result).isEqualByComparingTo("104166.67");
	}
}
