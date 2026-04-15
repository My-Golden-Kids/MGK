package com.mgk.bemgk.service;

import com.mgk.bemgk.dto.product.ProductPersonalizedReportResponse;
import com.mgk.bemgk.entity.MedicalDocument;
import com.mgk.bemgk.entity.MedicalDocumentType;
import com.mgk.bemgk.entity.Pet;
import com.mgk.bemgk.repository.MedicalDocumentRepository;
import com.mgk.bemgk.repository.PetRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class FutureMedicalCostService {

	private static final BigDecimal TWELVE = BigDecimal.valueOf(12);
	private static final BigDecimal ZERO_POINT_SEVEN = new BigDecimal("0.7");
	private static final BigDecimal ZERO_POINT_THREE = new BigDecimal("0.3");
	private static final BigDecimal ZERO_POINT_EIGHT = new BigDecimal("0.8");
	private static final BigDecimal ONE_POINT_TWO = new BigDecimal("1.2");
	private static final BigDecimal ONE_POINT_ONE = new BigDecimal("1.1");
	private static final BigDecimal ONE_POINT_ONE_FIVE = new BigDecimal("1.15");
	private static final BigDecimal TEN_THOUSAND = BigDecimal.valueOf(10_000);

	private final MedicalDocumentRepository medicalDocumentRepository;
	private final PetRepository petRepository;
	private final CurrentUserService currentUserService;
	private final ProductService productService;

	public FutureMedicalCostService(
		MedicalDocumentRepository medicalDocumentRepository,
		PetRepository petRepository,
		CurrentUserService currentUserService,
		ProductService productService
	) {
		this.medicalDocumentRepository = medicalDocumentRepository;
		this.petRepository = petRepository;
		this.currentUserService = currentUserService;
		this.productService = productService;
	}

	public boolean isFutureMedicalCostQuery(String transcript) {
		String normalized = normalize(transcript);

		boolean asksFuture = normalized.contains("앞으로")
			|| normalized.contains("미래")
			|| normalized.contains("나중")
			|| normalized.contains("예상");
		boolean asksMedicalCost = normalized.contains("병원비")
			|| normalized.contains("의료비")
			|| (normalized.contains("병원") && normalized.contains("얼마"));

		return asksFuture && asksMedicalCost;
	}

	public String answer(Long petId) {
		Pet pet = resolveOwnedAlivePet(petId);
		List<MedicalDocument> recentMedicalDocuments = findRecentMedicalDocuments(pet.getId());
		BigDecimal monthlyPrediction = predictMonthlyMedicalCost(pet, recentMedicalDocuments);
		BigDecimal minMonthly = monthlyPrediction.multiply(ZERO_POINT_EIGHT).setScale(0, RoundingMode.HALF_UP);
		BigDecimal maxMonthly = monthlyPrediction.multiply(ONE_POINT_TWO).setScale(0, RoundingMode.HALF_UP);

		String baseSentence = "%s의 현재 기록과 연령 기준으로 월 평균 %s 정도 예상됩니다."
			.formatted(pet.getName(), formatRange(minMonthly, maxMonthly));

		ProductPersonalizedReportResponse insuranceRecommendation = findInsuranceRecommendation();
		if (insuranceRecommendation == null
			|| insuranceRecommendation.getEstimatedAnnualBenefit() == null
			|| insuranceRecommendation.getEstimatedAnnualBenefit().compareTo(BigDecimal.ZERO) <= 0) {
			return baseSentence;
		}

		return baseSentence + " 지금 보험에 가입하면 연간 약 %s 절약될 수 있어요."
			.formatted(formatAmount(insuranceRecommendation.getEstimatedAnnualBenefit()));
	}

	private Pet resolveOwnedAlivePet(Long petId) {
		Long userId = currentUserService.getCurrentUserId();

		Pet pet = petId == null
			? petRepository.findByUser_Id(userId).stream()
				.filter(candidate -> !candidate.isDead())
				.findFirst()
				.orElseThrow(() -> new ResponseStatusException(
					HttpStatus.NOT_FOUND,
					"미래 병원비를 예측할 반려동물이 없습니다."
				))
			: petRepository.findByIdAndUser_Id(petId, userId)
				.orElseThrow(() -> new ResponseStatusException(
					HttpStatus.NOT_FOUND,
					"반려동물을 찾을 수 없습니다."
				));

		if (pet.isDead()) {
			throw new ResponseStatusException(
				HttpStatus.CONFLICT,
				"사망한 반려동물은 미래 병원비 예측 대상에서 제외됩니다."
			);
		}

		return pet;
	}

	private List<MedicalDocument> findRecentMedicalDocuments(Long petId) {
		LocalDate oneYearAgo = LocalDate.now().minusYears(1);

		return medicalDocumentRepository.findByPet_IdOrderByDateDescCreatedAtDesc(petId).stream()
			.filter(document -> document.getType() != MedicalDocumentType.VACCINATION)
			.filter(document -> {
				LocalDate referenceDate = document.getDate();
				if (referenceDate != null) {
					return !referenceDate.isBefore(oneYearAgo);
				}
				return document.getCreatedAt() != null
					&& !document.getCreatedAt().toLocalDate().isBefore(oneYearAgo);
			})
			.toList();
	}

	private BigDecimal predictMonthlyMedicalCost(Pet pet, List<MedicalDocument> recentMedicalDocuments) {
		BigDecimal baselineMonthlyCost = getAgeBasedAnnualMedicalCost(pet).divide(TWELVE, 0, RoundingMode.HALF_UP);

		if (recentMedicalDocuments.isEmpty()) {
			return applyRiskFactor(baselineMonthlyCost, pet, List.of());
		}

		LocalDate oldestDate = recentMedicalDocuments.stream()
			.map(document -> document.getDate() != null
				? document.getDate()
				: document.getCreatedAt() == null ? LocalDate.now() : document.getCreatedAt().toLocalDate())
			.min(LocalDate::compareTo)
			.orElse(LocalDate.now());

		long observedMonths = Math.max(1, ChronoUnit.MONTHS.between(oldestDate.withDayOfMonth(1), LocalDate.now().withDayOfMonth(1)) + 1);
		BigDecimal totalMedicalCost = recentMedicalDocuments.stream()
			.map(MedicalDocument::getTotalAmount)
			.filter(amount -> amount != null && amount > 0)
			.map(BigDecimal::valueOf)
			.reduce(BigDecimal.ZERO, BigDecimal::add);

		BigDecimal actualMonthlyCost = totalMedicalCost.compareTo(BigDecimal.ZERO) > 0
			? totalMedicalCost.divide(BigDecimal.valueOf(observedMonths), 0, RoundingMode.HALF_UP)
			: baselineMonthlyCost;

		BigDecimal mixedMonthlyCost = actualMonthlyCost.multiply(ZERO_POINT_SEVEN)
			.add(baselineMonthlyCost.multiply(ZERO_POINT_THREE))
			.setScale(0, RoundingMode.HALF_UP);

		return applyRiskFactor(mixedMonthlyCost, pet, recentMedicalDocuments);
	}

	private BigDecimal applyRiskFactor(
		BigDecimal monthlyCost,
		Pet pet,
		List<MedicalDocument> recentMedicalDocuments
	) {
		BigDecimal adjusted = monthlyCost;

		if (isSeniorPet(pet)) {
			adjusted = adjusted.multiply(ONE_POINT_ONE);
		}

		boolean hasDiseaseMention = recentMedicalDocuments.stream()
			.map(MedicalDocument::getDetails)
			.filter(details -> details != null && !details.isBlank())
			.map(details -> details.toLowerCase(Locale.ROOT))
			.anyMatch(details -> details.contains("질환")
				|| details.contains("질병")
				|| details.contains("만성")
				|| details.contains("염증")
				|| details.contains("수술"));

		if (hasDiseaseMention) {
			adjusted = adjusted.multiply(ONE_POINT_ONE_FIVE);
		}

		return adjusted.setScale(0, RoundingMode.HALF_UP);
	}

	private boolean isSeniorPet(Pet pet) {
		Double age = pet.getAge();
		if (age == null) {
			return false;
		}

		String species = safeLower(pet.getSpecies());
		if (species.contains("고양이") || species.contains("cat")) {
			return age >= 10;
		}

		return age >= 7;
	}

	private BigDecimal getAgeBasedAnnualMedicalCost(Pet pet) {
		double age = pet.getAge() == null ? 0 : pet.getAge();
		String species = safeLower(pet.getSpecies());
		boolean isCat = species.contains("고양이") || species.contains("cat");

		int annualCostInManwon;
		if (isCat) {
			annualCostInManwon = getCatAnnualMedicalCost(age);
		} else {
			annualCostInManwon = getDogAnnualMedicalCost(age);
		}

		return BigDecimal.valueOf(annualCostInManwon).multiply(TEN_THOUSAND);
	}

	private int getDogAnnualMedicalCost(double age) {
		if (age <= 1) return 35;
		if (age <= 2) return 97;
		if (age <= 3) return 93;
		if (age <= 5) return 188;
		if (age <= 7) return 99;
		if (age <= 9) return 127;
		if (age <= 14) return 190;
		return 292;
	}

	private int getCatAnnualMedicalCost(double age) {
		if (age <= 1) return 96;
		if (age <= 2) return 84;
		if (age <= 3) return 114;
		if (age <= 5) return 91;
		if (age <= 7) return 138;
		if (age <= 9) return 155;
		if (age <= 14) return 210;
		return 134;
	}

	private ProductPersonalizedReportResponse findInsuranceRecommendation() {
		Long userId = currentUserService.getCurrentUserId();

		return productService.getPersonalizedProductReports(userId).stream()
			.filter(ProductPersonalizedReportResponse::getEligible)
			.filter(report -> report.getProductType() == com.mgk.bemgk.entity.ProductType.INSURANCE)
			.findFirst()
			.orElse(null);
	}

	private String formatRange(BigDecimal minAmount, BigDecimal maxAmount) {
		return "%s~%s".formatted(formatAmount(minAmount), formatAmount(maxAmount));
	}

	private String formatAmount(BigDecimal amount) {
		if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
			return "0원";
		}

		if (amount.compareTo(TEN_THOUSAND) >= 0) {
			BigDecimal manwon = amount.divide(TEN_THOUSAND, 1, RoundingMode.HALF_UP).stripTrailingZeros();
			return manwon.toPlainString() + "만원";
		}

		return String.format("%,d원", amount.setScale(0, RoundingMode.HALF_UP).longValue());
	}

	private String normalize(String text) {
		if (text == null) {
			return "";
		}
		return text.replaceAll("[\\s?？!！.。,，]", "");
	}

	private String safeLower(String value) {
		return value == null ? "" : value.toLowerCase(Locale.ROOT);
	}
}
