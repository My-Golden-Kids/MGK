package com.mgk.bemgk.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.mgk.bemgk.dto.product.ProductPersonalizedReportResponse;
import com.mgk.bemgk.entity.MedicalDocument;
import com.mgk.bemgk.entity.MedicalDocumentType;
import com.mgk.bemgk.entity.Pet;
import com.mgk.bemgk.entity.PetSize;
import com.mgk.bemgk.entity.ProductType;
import com.mgk.bemgk.repository.MedicalDocumentRepository;
import com.mgk.bemgk.repository.PetRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class FutureMedicalCostServiceTest {

	@Mock
	private MedicalDocumentRepository medicalDocumentRepository;

	@Mock
	private PetRepository petRepository;

	@Mock
	private CurrentUserService currentUserService;

	@Mock
	private ProductService productService;

	@InjectMocks
	private FutureMedicalCostService futureMedicalCostService;

	@Test
	void isFutureMedicalCostQuery_detectsFutureHospitalQuestion() {
		assertThat(futureMedicalCostService.isFutureMedicalCostQuery("앞으로 병원비 얼마나 들까?")).isTrue();
		assertThat(futureMedicalCostService.isFutureMedicalCostQuery("오늘 병원 얼마였지?")).isFalse();
	}

	@Test
	void answer_returnsPredictionAndInsuranceSavingSentence() {
		Pet pet = pet("멩이", "강아지", 8.0, PetSize.중형, false);
		MedicalDocument document = new MedicalDocument();
		document.setPet(pet);
		document.setPetName("멩이");
		document.setType(MedicalDocumentType.CHECKUP);
		document.setDate(LocalDate.now().minusMonths(2));
		document.setTotalAmount(180_000);
		document.setDetails("만성 질환 관리");

		when(currentUserService.getCurrentUserId()).thenReturn(1L);
		when(petRepository.findByUser_Id(1L)).thenReturn(List.of(pet));
		when(medicalDocumentRepository.findByPet_IdOrderByDateDescCreatedAtDesc(1L)).thenReturn(List.of(document));
		when(productService.getPersonalizedProductReports(1L))
			.thenReturn(List.of(ProductPersonalizedReportResponse.builder()
				.productType(ProductType.INSURANCE)
				.eligible(true)
				.estimatedAnnualBenefit(BigDecimal.valueOf(800_000))
				.build()));

		String result = futureMedicalCostService.answer(null);

		assertThat(result).contains("멩이의 현재 기록과 연령 기준으로 월 평균");
		assertThat(result).contains("지금 보험에 가입하면 연간 약 80만원 절약될 수 있어요.");
	}

	@Test
	void answer_throwsWhenNoAlivePetExists() {
		when(currentUserService.getCurrentUserId()).thenReturn(1L);
		when(petRepository.findByUser_Id(1L)).thenReturn(List.of());

		assertThatThrownBy(() -> futureMedicalCostService.answer(null))
			.isInstanceOf(ResponseStatusException.class)
			.hasMessageContaining("미래 병원비를 예측할 반려동물이 없습니다.");
	}

	private Pet pet(String name, String species, double age, PetSize size, boolean death) {
		Pet pet = Pet.builder()
			.name(name)
			.species(species)
			.age(age)
			.size(size)
			.death(death)
			.build();
		ReflectionTestUtils.setField(pet, "id", 1L);
		return pet;
	}
}
