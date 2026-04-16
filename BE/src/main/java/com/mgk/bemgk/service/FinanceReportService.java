package com.mgk.bemgk.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mgk.bemgk.dto.finance.FinanceExpenseCategoryResponse;
import com.mgk.bemgk.dto.finance.FinanceMonthlyExpenseChartResponse;
import com.mgk.bemgk.dto.finance.FinanceReportResponse;
import com.mgk.bemgk.dto.product.ProductPersonalizedReportResponse;
import com.mgk.bemgk.entity.AccountBook;
import com.mgk.bemgk.entity.AccountBookCategory;
import com.mgk.bemgk.entity.Pet;
import com.mgk.bemgk.repository.AccountBookRepository;
import com.mgk.bemgk.repository.AccountRepository;
import com.mgk.bemgk.repository.PetRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinanceReportService {

	private static final BigDecimal ONE_HUNDRED = BigDecimal.valueOf(100);
	private static final BigDecimal TWELVE = BigDecimal.valueOf(12);

	private final PetRepository petRepository;
	private final AccountBookRepository accountBookRepository;
	private final AccountRepository accountRepository;
	private final ProductService productService;

	public FinanceReportResponse getRetirementReport(Long userId) {
		List<Pet> pets = petRepository.findByUser_Id(userId);
		List<Pet> alivePets = getAlivePetsAsOfToday(pets);

		BigDecimal monthlyAverageExpense = calculateMonthlyAverageExpense(userId);
		BigDecimal totalAsset = defaultAmount(accountRepository.sumMoneyAmountByUserId(userId));
		BigDecimal futurePetCost = calculateFuturePetCost(monthlyAverageExpense, alivePets);
		FinanceExpenseCategoryResponse dominantCategory = calculateDominantCategory(userId);
		ProductPersonalizedReportResponse recommendedProduct = productService.getFeaturedPersonalizedProduct(userId);

		BigDecimal retirementImpactPercent = BigDecimal.ZERO;
		if (totalAsset.compareTo(BigDecimal.ZERO) > 0) {
			retirementImpactPercent = futurePetCost
				.divide(totalAsset, 4, RoundingMode.HALF_UP)
				.multiply(ONE_HUNDRED)
				.setScale(1, RoundingMode.HALF_UP);
		}

		return FinanceReportResponse.builder()
			.totalPetCost(futurePetCost.setScale(0, RoundingMode.HALF_UP))
			.retirementPercent(retirementImpactPercent)
			.averageExpense(monthlyAverageExpense.setScale(0, RoundingMode.HALF_UP))
			.totalAsset(totalAsset.setScale(0, RoundingMode.HALF_UP))
			.dominantCategory(dominantCategory)
			.expenseCategory(dominantCategory)
			.recommendedProduct(recommendedProduct)
			.build();
	}

	public FinanceMonthlyExpenseChartResponse getMonthlyExpenseChart(Long userId) {
		LocalDate now = LocalDate.now();
		YearMonth currentMonth = YearMonth.from(now);

		Map<YearMonth, BigDecimal> monthlyAmountMap = new LinkedHashMap<>();
		for (int i = 11; i >= 0; i--) {
			YearMonth targetMonth = currentMonth.minusMonths(i);
			monthlyAmountMap.put(targetMonth, BigDecimal.ZERO);
		}

		LocalDateTime startDateTime = currentMonth.minusMonths(11).atDay(1).atStartOfDay();
		LocalDateTime endDateTime = currentMonth.atEndOfMonth().atTime(23, 59, 59);

		List<Object[]> rawMonthlyExpenses =
			accountBookRepository.sumMonthlyPetExpenseByUserId(userId, startDateTime, endDateTime);

		for (Object[] row : rawMonthlyExpenses) {
			Integer year = ((Number)row[0]).intValue();
			Integer month = ((Number)row[1]).intValue();
			BigDecimal amount = row[2] == null ? BigDecimal.ZERO : new BigDecimal(row[2].toString());

			YearMonth ym = YearMonth.of(year, month);
			if (monthlyAmountMap.containsKey(ym)) {
				monthlyAmountMap.put(ym, amount);
			}
		}

		List<FinanceMonthlyExpenseChartResponse.MonthlyExpenseItem> monthlyExpenses = new ArrayList<>();
		monthlyAmountMap.forEach((ym, amount) -> {
			monthlyExpenses.add(
				FinanceMonthlyExpenseChartResponse.MonthlyExpenseItem.builder()
					.month(ym.getMonthValue() + "월")
					.amount(defaultAmount(amount).setScale(0, RoundingMode.HALF_UP))
					.build()
			);
		});

		return FinanceMonthlyExpenseChartResponse.builder()
			.monthlyExpenses(monthlyExpenses)
			.build();
	}

	// 최근 1년간 사용자 기준 월 지출 평균
	private BigDecimal calculateMonthlyAverageExpense(Long userId) {
		LocalDateTime firstPetSpendDateTime = accountBookRepository.findFirstPetSpendDateByUserId(userId);

		if (firstPetSpendDateTime == null) {
			return BigDecimal.ZERO;
		}

		YearMonth firstSpendMonth = YearMonth.from(firstPetSpendDateTime);
		YearMonth currentMonth = YearMonth.now();
		long observedMonths = ChronoUnit.MONTHS.between(firstSpendMonth, currentMonth) + 1;

		if (observedMonths <= 0) {
			return BigDecimal.ZERO;
		}

		YearMonth startMonth = observedMonths < 12 ? firstSpendMonth : currentMonth.minusMonths(11);
		Map<YearMonth, BigDecimal> monthlyExpenseMap = getMonthlyExpenseMap(userId, startMonth, currentMonth);

		BigDecimal monthlyExpenseSum = BigDecimal.ZERO;
		long countedMonths = 0;

		for (YearMonth month = startMonth; !month.isAfter(currentMonth); month = month.plusMonths(1)) {
			BigDecimal monthlyExpense = defaultAmount(monthlyExpenseMap.get(month));
			monthlyExpenseSum = monthlyExpenseSum.add(monthlyExpense);
			countedMonths++;
		}

		if (countedMonths == 0) {
			return BigDecimal.ZERO;
		}

		return monthlyExpenseSum.divide(BigDecimal.valueOf(countedMonths), 2, RoundingMode.HALF_UP);
	}

	/**
	 * 1) 기준 수명 이전: 남은 수명까지 계산
	 * 2) 기준 수명 이후: 1년씩 추가로 계산
	 *
	 * 여러 마리일 경우:
	 * - 연차별로 살아 있는 반려동물 수를 계산
	 * - 전체 연 지출 * (해당 연차 생존 반려동물 수 / 전체 반려동물 수)
	 * - 각 연차마다 살아 있는 반려동물의 의료비를 합산
	 */
	private BigDecimal calculateFuturePetCost(
		BigDecimal monthlyAverageExpense,
		List<Pet> pets
	) {
		if (pets == null || pets.isEmpty() || monthlyAverageExpense.compareTo(BigDecimal.ZERO) <= 0) {
			return BigDecimal.ZERO;
		}

		BigDecimal monthlyExpensePerPet = monthlyAverageExpense.divide(
			BigDecimal.valueOf(pets.size()),
			2,
			RoundingMode.HALF_UP
		);
		BigDecimal annualExpensePerPet = monthlyExpensePerPet.multiply(TWELVE);

		List<Integer> projectedYears = pets.stream()
			.map(this::getProjectedYears)
			.toList();

		BigDecimal totalCost = BigDecimal.ZERO;

		for (int i = 0; i < pets.size(); i++) {
			Pet pet = pets.get(i);
			int projectedYear = projectedYears.get(i);
			BigDecimal petCost = annualExpensePerPet.multiply(BigDecimal.valueOf(projectedYear));

			for (int year = 1; year <= projectedYear; year++) {
				double currentAge = pet.getAge();
				double ageAtThatYear = currentAge + year - 1;
				petCost = petCost.add(getAnnualMedicalCost(pet, ageAtThatYear));
			}

			totalCost = totalCost.add(petCost);
		}

		return totalCost;
	}

	/**
	 * 기준 수명 이전이면 남은 햇수 계산
	 * 기준 수명 이후면 1년만 계산
	 */
	private int getProjectedYears(Pet pet) {
		BigDecimal lifeExpectancy = getLifeExpectancyYears(pet);
		BigDecimal currentAge = BigDecimal.valueOf(pet.getAge());

		BigDecimal remainingYears = lifeExpectancy.subtract(currentAge);

		if (remainingYears.compareTo(BigDecimal.ZERO) > 0) {
			return remainingYears
				.setScale(0, RoundingMode.CEILING) // 올림
				.intValue();
		}

		return 1;
	}

	/**
	 * 평균 수명 기준 - 출처 : BeMyPet
	 *
	 * 반려견
	 * - 소형: 15년
	 * - 중형: 13년
	 * - 대형: 12년
	 *
	 * 반려묘
	 * - 20년
	 */
	public BigDecimal getLifeExpectancyYears(Pet pet) {
		String species = safeLower(pet.getSpecies());
		String size = pet.getSize() == null ? "" : pet.getSize().name().toLowerCase();

		if (species.contains("고양이") || species.contains("cat")) {
			return BigDecimal.valueOf(20.0);
		}

		return switch (size) {
			case "small", "소형" -> BigDecimal.valueOf(15.0);
			case "medium", "중형" -> BigDecimal.valueOf(13.0);
			case "large", "대형" -> BigDecimal.valueOf(12.0);
			default -> BigDecimal.valueOf(13.0);
		};
	}

	// 연 의료비
	private BigDecimal getAnnualMedicalCost(Pet pet, double age) {
		String species = safeLower(pet.getSpecies());
		boolean isCat = species.contains("고양이") || species.contains("cat");

		int cost;
		if (isCat) {
			cost = getCatAnnualMedicalCost(age);
		} else {
			cost = getDogAnnualMedicalCost(age);
		}

		return BigDecimal.valueOf(cost)
			.multiply(BigDecimal.valueOf(10_000L));
	}

	// 반려견 연령대별 평균 치료비 (만원) - 출처: KB Think
	private int getDogAnnualMedicalCost(double age) {
		if (age <= 1) {
			return 35;
		} else if (age <= 2) {
			return 97;
		} else if (age <= 3) {
			return 93;
		} else if (age <= 5) {
			return 188;
		} else if (age <= 7) {
			return 99;
		} else if (age <= 9) {
			return 127;
		} else if (age <= 14) {
			return 190;
		}
		return 292;
	}

	// 반려묘 연령대별 평균 치료비 (만원) - 출처: KB Think
	private int getCatAnnualMedicalCost(double age) {
		if (age <= 1) {
			return 96;
		} else if (age <= 2) {
			return 84;
		} else if (age <= 3) {
			return 114;
		} else if (age <= 5) {
			return 91;
		} else if (age <= 7) {
			return 138;
		} else if (age <= 9) {
			return 155;
		} else if (age <= 14) {
			return 210;
		}
		return 134;
	}

	private BigDecimal defaultAmount(BigDecimal amount) {
		return amount == null ? BigDecimal.ZERO : amount;
	}

	private String safeLower(String value) {
		return value == null ? "" : value.toLowerCase();
	}

	private Map<YearMonth, BigDecimal> getMonthlyExpenseMap(Long userId, YearMonth startMonth, YearMonth endMonth) {
		Map<YearMonth, BigDecimal> monthlyExpenseMap = new LinkedHashMap<>();
		for (YearMonth month = startMonth; !month.isAfter(endMonth); month = month.plusMonths(1)) {
			monthlyExpenseMap.put(month, BigDecimal.ZERO);
		}

		LocalDateTime startDateTime = startMonth.atDay(1).atStartOfDay();
		LocalDateTime endDateTime = endMonth.atEndOfMonth().atTime(23, 59, 59);

		List<Object[]> rawMonthlyExpenses =
			accountBookRepository.sumMonthlyPetExpenseByUserId(userId, startDateTime, endDateTime);

		for (Object[] row : rawMonthlyExpenses) {
			YearMonth month = YearMonth.of(
				((Number)row[0]).intValue(),
				((Number)row[1]).intValue()
			);
			BigDecimal amount = row[2] == null ? BigDecimal.ZERO : new BigDecimal(row[2].toString());
			if (monthlyExpenseMap.containsKey(month)) {
				monthlyExpenseMap.put(month, amount);
			}
		}

		return monthlyExpenseMap;
	}

	private int countActivePetsForMonth(List<Pet> pets, YearMonth month) {
		int count = 0;
		LocalDate monthStart = month.atDay(1);

		for (Pet pet : pets) {
			if (isDeadBeforeMonthStart(pet, monthStart)) {
				continue;
			}

			count++;
		}

		return count;
	}

	private List<Pet> getAlivePetsAsOfToday(List<Pet> pets) {
		LocalDate today = LocalDate.now();
		return pets.stream()
			.filter(pet -> !isDeadBeforeMonthStart(pet, today.plusDays(1)))
			.toList();
	}

	private boolean isDeadBeforeMonthStart(Pet pet, LocalDate monthStart) {
		if (!Boolean.TRUE.equals(pet.getDeath())) {
			return false;
		}

		if (pet.getDeathDate() == null) {
			return true;
		}

		return pet.getDeathDate().toLocalDate().isBefore(monthStart);
	}

	private FinanceExpenseCategoryResponse calculateDominantCategory(Long userId) {
		YearMonth currentMonth = YearMonth.now();
		LocalDateTime startDateTime = currentMonth.atDay(1).atStartOfDay();
		LocalDateTime endDateTime = currentMonth.atEndOfMonth().atTime(23, 59, 59);

		List<AccountBook> monthlyExpenses = accountBookRepository.findMonthlyExpensesByUserId(
				userId,
				startDateTime,
				endDateTime
			).stream()
			.filter(accountBook -> !"첫 계좌연결".equals(accountBook.getTitle()))
			.toList();

		BigDecimal hospitalAmount = sumCategoryAmount(monthlyExpenses, AccountBookCategory.Hospital);
		BigDecimal foodAmount = sumCategoryAmount(monthlyExpenses, AccountBookCategory.Food);
		BigDecimal etcAmount = sumCategoryAmount(monthlyExpenses, AccountBookCategory.Etc);
		BigDecimal totalAmount = hospitalAmount.add(foodAmount).add(etcAmount);

		if (totalAmount.compareTo(BigDecimal.ZERO) <= 0) {
			return FinanceExpenseCategoryResponse.builder()
				.category("Etc")
				.categoryLabel("기타")
				.amount(BigDecimal.ZERO)
				.percent(BigDecimal.ZERO)
				.build();
		}

		Map<AccountBookCategory, BigDecimal> categoryAmounts = Map.of(
			AccountBookCategory.Food, foodAmount,
			AccountBookCategory.Hospital, hospitalAmount,
			AccountBookCategory.Etc, etcAmount
		);

		AccountBookCategory dominantCategory = categoryAmounts.entrySet().stream()
			.max((entry1, entry2) -> entry1.getValue().compareTo(entry2.getValue()))
			.map(Map.Entry::getKey)
			.orElse(AccountBookCategory.Etc);

		BigDecimal dominantAmount = categoryAmounts.getOrDefault(dominantCategory, BigDecimal.ZERO);

		BigDecimal percent = dominantAmount
			.divide(totalAmount, 4, RoundingMode.HALF_UP)
			.multiply(ONE_HUNDRED)
			.setScale(1, RoundingMode.HALF_UP);

		return FinanceExpenseCategoryResponse.builder()
			.category(dominantCategory.name())
			.categoryLabel(toCategoryLabel(dominantCategory))
			.amount(dominantAmount.setScale(0, RoundingMode.HALF_UP))
			.percent(percent)
			.build();
	}

	private BigDecimal sumCategoryAmount(List<AccountBook> accountBooks, AccountBookCategory category) {
		return accountBooks.stream()
			.filter(accountBook -> accountBook.getCategory() == category)
			.map(AccountBook::getAmount)
			.reduce(BigDecimal.ZERO, BigDecimal::add);
	}

	private String toCategoryLabel(AccountBookCategory category) {
		return switch (category) {
			case Hospital -> "병원비";
			case Food -> "식비";
			case Etc -> "기타";
		};
	}
}
