package com.mgk.bemgk.service;

import com.mgk.bemgk.dto.finance.FinanceMonthlyExpenseChartResponse;
import com.mgk.bemgk.dto.finance.FinanceReportResponse;
import com.mgk.bemgk.entity.Pet;
import com.mgk.bemgk.repository.AccountBookRepository;
import com.mgk.bemgk.repository.AccountRepository;
import com.mgk.bemgk.repository.PetRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinanceReportService {

	private static final BigDecimal ONE_HUNDRED = BigDecimal.valueOf(100);
	private static final BigDecimal TWELVE = BigDecimal.valueOf(12);

	private final PetRepository petRepository;
	private final AccountBookRepository accountBookRepository;
	private final AccountRepository accountRepository;

	public FinanceReportResponse getRetirementReport(Long userId) {
		List<Pet> pets = petRepository.findByUser_Id(userId);

		BigDecimal monthlyAverageExpense = calculateMonthlyAverageExpense(userId);
		BigDecimal totalAsset = defaultAmount(accountRepository.sumMoneyAmountByUserId(userId));
		BigDecimal futurePetCost = calculateFuturePetCost(monthlyAverageExpense, pets);

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

		LocalDate startDate = currentMonth.minusMonths(11).atDay(1);
		LocalDate endDate = currentMonth.atEndOfMonth();

		List<Object[]> rawMonthlyExpenses =
			accountBookRepository.sumMonthlyPetExpenseByUserId(userId, startDate, endDate);

		for (Object[] row : rawMonthlyExpenses) {
			Integer year = (Integer) row[0];
			Integer month = (Integer) row[1];
			BigDecimal amount = defaultAmount((BigDecimal) row[2]);

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


	// 최근 1년간 user 기준 반려동물 평균 한 달 지출
	private BigDecimal calculateMonthlyAverageExpense(Long userId) {
		LocalDate firstPetSpendDate = accountBookRepository.findFirstPetSpendDateByUserId(userId);

		if (firstPetSpendDate == null) {
			return BigDecimal.ZERO;
		}

		LocalDate now = LocalDate.now();

		long observedMonths = ChronoUnit.MONTHS.between(firstPetSpendDate.withDayOfMonth(1), now.withDayOfMonth(1)) + 1;

		if (observedMonths <= 0) {
			observedMonths = 1;
		}

		// 1년 미만: 지금까지 평균
		if (observedMonths < 12) {
			BigDecimal totalExpense = defaultAmount(accountBookRepository.sumPetExpenseByUserId(userId));

			return totalExpense.divide(BigDecimal.valueOf(observedMonths), 2, RoundingMode.HALF_UP);
		}

		// 1년 이상: 최근 1년간 평균
		LocalDate oneYearAgo = now.minusYears(1).withDayOfMonth(1);
		BigDecimal lastYearExpense = defaultAmount(accountBookRepository.sumPetExpenseLastYear(userId, oneYearAgo));

		return lastYearExpense.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);
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

		BigDecimal annualExpense = monthlyAverageExpense.multiply(BigDecimal.valueOf(12));
		int totalPetCount = pets.size();

		List<Integer> projectedYears = pets.stream()
			.map(this::getProjectedYears)
			.toList();

		int maxYears = projectedYears.stream()
			.max(Integer::compareTo)
			.orElse(0);

		BigDecimal totalCost = BigDecimal.ZERO;

		for (int year = 1; year <= maxYears; year++) {
			int alivePetCount = 0;
			BigDecimal medicalCostForYear = BigDecimal.ZERO;

			for (int i = 0; i < pets.size(); i++) {
				Pet pet = pets.get(i);
				int projectedYear = projectedYears.get(i);

				if (year <= projectedYear) {
					alivePetCount++;

					double currentAge = pet.getAge();
					double ageAtThatYear = currentAge + year - 1;

					medicalCostForYear = medicalCostForYear.add(getAnnualMedicalCost(pet, ageAtThatYear));
				}
			}

			if (alivePetCount == 0) continue;

			BigDecimal livingCostForYear = annualExpense
				.multiply(BigDecimal.valueOf(alivePetCount))
				.divide(BigDecimal.valueOf(totalPetCount), 2, RoundingMode.HALF_UP);

			totalCost = totalCost.add(livingCostForYear).add(medicalCostForYear);
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
	private BigDecimal getLifeExpectancyYears(Pet pet) {
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
		if (age <= 1) return 35;
		else if (age <= 2) return 97;
		else if (age <= 3) return 93;
		else if (age <= 5) return 188;
		else if (age <= 7) return 99;
		else if (age <= 9) return 127;
		else if (age <= 14) return 190;
		return 292;
	}

	// 반려묘 연령대별 평균 치료비 (만원) - 출처: KB Think
	private int getCatAnnualMedicalCost(double age) {
		if (age <= 1) return 96;
		else if (age <= 2) return 84;
		else if (age <= 3) return 114;
		else if (age <= 5) return 91;
		else if (age <= 7) return 138;
		else if (age <= 9) return 155;
		else if (age <= 14) return 210;
		return 134;
	}

	private BigDecimal defaultAmount(BigDecimal amount) {
		return amount == null ? BigDecimal.ZERO : amount;
	}

	private String safeLower(String value) {
		return value == null ? "" : value.toLowerCase();
	}
}