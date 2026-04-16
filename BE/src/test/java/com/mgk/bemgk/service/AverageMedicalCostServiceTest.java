package com.mgk.bemgk.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.mgk.bemgk.entity.AverageMedicalCost;
import com.mgk.bemgk.entity.Pet;
import com.mgk.bemgk.entity.PetSize;
import com.mgk.bemgk.repository.AverageMedicalCostRepository;
import com.mgk.bemgk.repository.PetRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class AverageMedicalCostServiceTest {

	@Mock
	private AverageMedicalCostRepository averageMedicalCostRepository;

	@Mock
	private PetRepository petRepository;

	@Mock
	private CurrentUserService currentUserService;

	@InjectMocks
	private AverageMedicalCostService averageMedicalCostService;

	@Test
	void answerByItem_usesAliasAndPetConditionSpecificCost() {
		Pet pet = Pet.builder()
			.name("멩이")
			.species("강아지")
			.age(4.0)
			.size(PetSize.소형)
			.death(false)
			.build();
		ReflectionTestUtils.setField(pet, "id", 1L);

		when(currentUserService.getCurrentUserId()).thenReturn(1L);
		when(petRepository.findByIdAndUser_Id(1L, 1L)).thenReturn(Optional.of(pet));
		when(averageMedicalCostRepository.findByItem("초진 진찰료"))
			.thenReturn(List.of(AverageMedicalCost.builder()
				.category("진찰")
				.item("초진 진찰료")
				.species("DOG")
				.size("SMALL")
				.avgCost(30000)
				.build()));

		String result = averageMedicalCostService.answerByItem(1L, "초진료");

		assertThat(result).isEqualTo("초진 진찰료 평균은 30,000원이에요.");
	}

	@Test
	void isAverageCostQuery_detectsKeywordAndAlias() {
		assertThat(averageMedicalCostService.isAverageCostQuery("초진료 평균 얼마야?")).isTrue();
		assertThat(averageMedicalCostService.isAverageCostQuery("산책 기록 보여줘")).isFalse();
	}

	@Test
	void answer_usesDefaultAlivePetAndAllFallback() {
		Pet pet = Pet.builder()
			.name("멩이")
			.species("고양이")
			.age(2.0)
			.death(false)
			.build();

		when(currentUserService.getCurrentUserId()).thenReturn(1L);
		when(petRepository.findByUser_Id(1L)).thenReturn(List.of(pet));
		when(averageMedicalCostRepository.findByItem("입원비"))
			.thenReturn(List.of(AverageMedicalCost.builder()
				.category("입원")
				.item("입원비")
				.species("ALL")
				.size("ALL")
				.avgCost(56417)
				.build()));

		String result = averageMedicalCostService.answer(null, "입원비 평균 알려줘");

		assertThat(result).isEqualTo("입원비 평균은 56,417원이에요.");
	}

	@Test
	void answerByItem_throwsWhenPetIsDead() {
		Pet pet = Pet.builder()
			.name("멩이")
			.species("강아지")
			.age(4.0)
			.size(PetSize.중형)
			.death(true)
			.build();

		when(currentUserService.getCurrentUserId()).thenReturn(1L);
		when(petRepository.findByIdAndUser_Id(1L, 1L)).thenReturn(Optional.of(pet));

		assertThatThrownBy(() -> averageMedicalCostService.answerByItem(1L, "초진료"))
			.isInstanceOf(ResponseStatusException.class);
	}
}
