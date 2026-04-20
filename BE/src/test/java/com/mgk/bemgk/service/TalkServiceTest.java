package com.mgk.bemgk.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mgk.bemgk.dto.talk.TalkResponse;
import com.mgk.bemgk.entity.MedicalDocument;
import com.mgk.bemgk.entity.MedicalDocumentType;
import com.mgk.bemgk.entity.Pet;
import com.mgk.bemgk.entity.PetWalkRecord;
import com.mgk.bemgk.repository.MedicalDocumentRepository;
import com.mgk.bemgk.repository.PetRepository;
import com.mgk.bemgk.repository.PetWalkRecordRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class TalkServiceTest {

	@Mock
	private ChatModel chatModel;

	@Mock
	private CurrentUserService currentUserService;

	@Mock
	private PetRepository petRepository;

	@Mock
	private MedicalDocumentRepository medicalDocumentRepository;

	@Mock
	private PetWalkRecordRepository petWalkRecordRepository;

	@Mock
	private AverageMedicalCostService averageMedicalCostService;

	@Mock
	private FutureMedicalCostService futureMedicalCostService;

	@InjectMocks
	private TalkService talkService;

	@Test
	void ask_returnsFutureMedicalCostAnswerBeforeFallbackModel() {
		when(averageMedicalCostService.isAverageCostQuery("앞으로 병원비 얼마나 들까?")).thenReturn(false);
		when(futureMedicalCostService.isFutureMedicalCostQuery("앞으로 병원비 얼마나 들까?")).thenReturn(true);
		when(futureMedicalCostService.answer(3L)).thenReturn("월 평균 6만원~9만원 예상됩니다.");

		TalkResponse response = talkService.ask("앞으로 병원비 얼마나 들까?", 3L);

		assertThat(response.message()).isEqualTo("월 평균 6만원~9만원 예상됩니다.");
		verify(futureMedicalCostService).answer(3L);
	}

	@Test
	void ask_handlesAverageCostReasonAndWalkAndMedicalQueries() {
		Pet pet = Pet.builder().name("멩이").death(false).build();
		ReflectionTestUtils.setField(pet, "id", 1L);
		PetWalkRecord walkRecord = PetWalkRecord.create(pet, "APP", LocalDateTime.now(), 4321, 1200, 1.5);
		MedicalDocument medicalDocument = new MedicalDocument();
		ReflectionTestUtils.setField(medicalDocument, "pet", pet);
		ReflectionTestUtils.setField(medicalDocument, "type", MedicalDocumentType.CHECKUP);
		ReflectionTestUtils.setField(medicalDocument, "date", LocalDate.of(2026, 4, 16));
		ReflectionTestUtils.setField(medicalDocument, "hospitalName", "하나병원");
		ReflectionTestUtils.setField(medicalDocument, "totalAmount", 50000);

		when(averageMedicalCostService.isAverageCostQuery("초진료 평균 알려줘")).thenReturn(true);
		when(averageMedicalCostService.answer(1L, "초진료 평균 알려줘"))
			.thenThrow(new ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "평균 진료비 정보를 찾을 수 없어요."));

		TalkResponse averageResponse = talkService.ask("초진료 평균 알려줘", 1L);
		assertThat(averageResponse.message()).isEqualTo("평균 진료비 정보를 찾을 수 없어요.");

		when(averageMedicalCostService.isAverageCostQuery("오늘 산책 했어?")).thenReturn(false);
		when(futureMedicalCostService.isFutureMedicalCostQuery("오늘 산책 했어?")).thenReturn(false);
		when(currentUserService.getCurrentUserId()).thenReturn(1L);
		when(petRepository.findByUser_Id(1L)).thenReturn(List.of(pet));
		when(petWalkRecordRepository.findFirstByPet_IdAndCompletedTrueAndWalkedAtBetweenOrderByWalkedAtDesc(eq(1L), any(), any()))
			.thenReturn(Optional.of(walkRecord));

		TalkResponse walkResponse = talkService.ask("오늘 산책 했어?", null);
		assertThat(walkResponse.message()).contains("멩이는 오늘 산책했어요");

		when(averageMedicalCostService.isAverageCostQuery("병원 언제 갔지?")).thenReturn(false);
		when(futureMedicalCostService.isFutureMedicalCostQuery("병원 언제 갔지?")).thenReturn(false);
		when(medicalDocumentRepository.findByPet_IdOrderByDateDescCreatedAtDesc(1L)).thenReturn(List.of(medicalDocument));

		TalkResponse medicalResponse = talkService.ask("병원 언제 갔지?", null);
		assertThat(medicalResponse.message()).contains("하나병원").contains("5만원");
	}

	@Test
	void talkPrivateHelpers_coverClassificationAndFormattingBranches() {
		Pet pet = Pet.builder().name("멩이").death(false).build();
		MedicalDocument vaccination = new MedicalDocument();
		ReflectionTestUtils.setField(vaccination, "type", MedicalDocumentType.VACCINATION);
		ReflectionTestUtils.setField(vaccination, "date", LocalDate.of(2026, 4, 16));
		ReflectionTestUtils.setField(vaccination, "hospitalName", "");
		ReflectionTestUtils.setField(vaccination, "totalAmount", 9000);

		assertThat((Object)ReflectionTestUtils.invokeMethod(talkService, "isWalkQuery", "오늘산책했어?")).isEqualTo(true);
		assertThat((Object)ReflectionTestUtils.invokeMethod(talkService, "isVaccinationQuery", "예방접종언제했어")).isEqualTo(true);
		assertThat((Object)ReflectionTestUtils.invokeMethod(talkService, "isMedicalQuery", "병원얼마들었어")).isEqualTo(true);

		String medicalAnswer = ReflectionTestUtils.invokeMethod(talkService, "buildMedicalAnswer", pet, vaccination);
		assertThat(medicalAnswer).contains("예방접종").contains("9000원");
	}
}
