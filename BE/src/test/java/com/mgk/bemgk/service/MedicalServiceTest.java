package com.mgk.bemgk.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import com.mgk.bemgk.dto.medical.CreateMedicalRecordRequest;
import com.mgk.bemgk.dto.medical.MedicalDocumentCountResponse;
import com.mgk.bemgk.dto.medical.MedicalRecordResponse;
import com.mgk.bemgk.entity.MedicalDocument;
import com.mgk.bemgk.entity.MedicalDocumentType;
import com.mgk.bemgk.entity.Pet;
import com.mgk.bemgk.repository.MedicalDocumentRepository;
import com.mgk.bemgk.repository.MedicalDocumentCountProjection;
import com.mgk.bemgk.repository.PetRepository;

@ExtendWith(MockitoExtension.class)
class MedicalServiceTest {

	@Mock
	private MedicalDocumentRepository medicalDocumentRepository;

	@Mock
	private PetRepository petRepository;

	@Mock
	private CurrentUserService currentUserService;

	@InjectMocks
	private MedicalService medicalService;

	@Test
	void createMedicalRecord_resolvesPetAndSavesDocument() {
		Long userId = 1L;
		Pet pet = Pet.builder().name("멩이").death(false).build();
		ReflectionTestUtils.setField(pet, "id", 1L);

		when(currentUserService.getCurrentUserId()).thenReturn(userId);
		when(petRepository.findByUser_Id(userId)).thenReturn(List.of(pet));
		when(medicalDocumentRepository.save(any(MedicalDocument.class))).thenAnswer(invocation -> {
			MedicalDocument saved = invocation.getArgument(0);
			ReflectionTestUtils.setField(saved, "id", 5L);
			return saved;
		});

		MedicalRecordResponse response = medicalService.createMedicalRecord(new CreateMedicalRecordRequest(
			1L, "2026-04-16", MedicalDocumentType.CHECKUP, "멩이", "하나병원", "검진", 50000, "https://image"
		));

		assertThat(response.getId()).isEqualTo(5L);
		assertThat(response.getPetId()).isEqualTo(1L);
		assertThat(response.getHospitalName()).isEqualTo("하나병원");
	}

	@Test
	void getMedicalRecords_andDocumentCounts_mapResponses() {
		MedicalDocument document = new MedicalDocument();
		Pet pet = Pet.builder().name("멩이").build();
		ReflectionTestUtils.setField(pet, "id", 1L);
		ReflectionTestUtils.setField(document, "id", 7L);
		ReflectionTestUtils.setField(document, "pet", pet);
		ReflectionTestUtils.setField(document, "petName", "멩이");
		ReflectionTestUtils.setField(document, "date", LocalDate.of(2026, 4, 16));
		ReflectionTestUtils.setField(document, "type", MedicalDocumentType.VACCINATION);
		ReflectionTestUtils.setField(document, "hospitalName", "하나병원");
		ReflectionTestUtils.setField(document, "details", "종합백신 접종");
		ReflectionTestUtils.setField(document, "totalAmount", 30000);

		when(currentUserService.getCurrentUserId()).thenReturn(1L);
		when(medicalDocumentRepository.findByPet_User_IdAndTypeOrderByDateDescCreatedAtDesc(1L, MedicalDocumentType.VACCINATION))
			.thenReturn(List.of(document));
		MedicalDocumentCountProjection projection = new MedicalDocumentCountProjection() {
			@Override
			public Long getPetId() {
				return 1L;
			}

			@Override
			public MedicalDocumentType getType() {
				return MedicalDocumentType.VACCINATION;
			}

			@Override
			public String getDetails() {
				return "종합백신";
			}

			@Override
			public Long getDocumentCount() {
				return 2L;
			}
		};

		when(medicalDocumentRepository.findDocumentCountsByPetIdAndType(1L, MedicalDocumentType.VACCINATION))
			.thenReturn(List.of(projection));

		List<MedicalRecordResponse> records = medicalService.getMedicalRecords(MedicalDocumentType.VACCINATION);
		List<MedicalDocumentCountResponse> counts =
			medicalService.getMedicalDocumentCounts(1L, MedicalDocumentType.VACCINATION);

		assertThat(records).hasSize(1);
		assertThat(records.getFirst().getId()).isEqualTo(7L);
		assertThat(counts).hasSize(1);
		assertThat(counts.getFirst().getCount()).isEqualTo(2L);
	}

	@Test
	void createMedicalRecord_throwsWhenNoAlivePetExists() {
		when(currentUserService.getCurrentUserId()).thenReturn(1L);
		when(petRepository.findByUser_Id(1L)).thenReturn(List.of());

		assertThatThrownBy(() -> medicalService.createMedicalRecord(new CreateMedicalRecordRequest(
			null, "2026-04-16", MedicalDocumentType.CHECKUP, "멩이", "병원", "검진", 10000, null
		))).isInstanceOf(ResponseStatusException.class);
	}

	@Test
	void createMedicalRecord_usesFirstPetWhenNameIsBlank() {
		Long userId = 1L;
		Pet firstPet = Pet.builder().name("멩이").death(false).build();
		Pet secondPet = Pet.builder().name("돌멩이").death(false).build();
		ReflectionTestUtils.setField(firstPet, "id", 1L);

		when(currentUserService.getCurrentUserId()).thenReturn(userId);
		when(petRepository.findByUser_Id(userId)).thenReturn(List.of(firstPet, secondPet));
		when(medicalDocumentRepository.save(any(MedicalDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));

		MedicalRecordResponse response = medicalService.createMedicalRecord(new CreateMedicalRecordRequest(
			null, "2026-04-16", MedicalDocumentType.CHECKUP, " ", "하나병원", "검진", 50000, null
		));

		assertThat(response.getPetId()).isEqualTo(1L);
	}

	@Test
	void getMedicalRecords_withoutTypeUsesAllDocumentsQuery() {
		MedicalDocument document = new MedicalDocument();
		Pet pet = Pet.builder().name("멩이").build();
		ReflectionTestUtils.setField(pet, "id", 1L);
		ReflectionTestUtils.setField(document, "id", 9L);
		ReflectionTestUtils.setField(document, "pet", pet);
		ReflectionTestUtils.setField(document, "petName", "멩이");
		ReflectionTestUtils.setField(document, "date", LocalDate.of(2026, 4, 10));
		ReflectionTestUtils.setField(document, "type", MedicalDocumentType.CHECKUP);
		ReflectionTestUtils.setField(document, "hospitalName", "하나병원");

		when(currentUserService.getCurrentUserId()).thenReturn(1L);
		when(medicalDocumentRepository.findByPet_User_IdOrderByDateDescCreatedAtDesc(1L))
			.thenReturn(List.of(document));

		List<MedicalRecordResponse> records = medicalService.getMedicalRecords(null);

		assertThat(records).hasSize(1);
		assertThat(records.getFirst().getType()).isEqualTo(MedicalDocumentType.CHECKUP);
	}

	@Test
	void createMedicalRecord_resolvesPetByPartialName() {
		Long userId = 1L;
		Pet firstPet = Pet.builder().name("멩이").death(false).build();
		Pet secondPet = Pet.builder().name("돌멩이").death(false).build();
		ReflectionTestUtils.setField(secondPet, "id", 2L);

		when(currentUserService.getCurrentUserId()).thenReturn(userId);
		when(petRepository.findByUser_Id(userId)).thenReturn(List.of(firstPet, secondPet));
		when(medicalDocumentRepository.save(any(MedicalDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));

		MedicalRecordResponse response = medicalService.createMedicalRecord(new CreateMedicalRecordRequest(
			null, "2026-04-16", MedicalDocumentType.CHECKUP, "돌", "하나병원", "검진", 10000, null
		));

		assertThat(response.getPetId()).isEqualTo(2L);
	}

	@Test
	void createMedicalRecord_resolvesPetByLevenshteinAndFallsBackToFirstPet() {
		Long userId = 1L;
		Pet firstPet = Pet.builder().name("멩이").death(false).build();
		Pet secondPet = Pet.builder().name("초코").death(false).build();
		ReflectionTestUtils.setField(firstPet, "id", 1L);
		ReflectionTestUtils.setField(secondPet, "id", 2L);

		when(currentUserService.getCurrentUserId()).thenReturn(userId);
		when(petRepository.findByUser_Id(userId)).thenReturn(List.of(firstPet, secondPet));
		when(medicalDocumentRepository.save(any(MedicalDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));

		MedicalRecordResponse nearMatch = medicalService.createMedicalRecord(new CreateMedicalRecordRequest(
			null, "2026-04-16", MedicalDocumentType.CHECKUP, "멍이", "하나병원", "검진", 10000, null
		));
		MedicalRecordResponse fallback = medicalService.createMedicalRecord(new CreateMedicalRecordRequest(
			null, "2026-04-16", MedicalDocumentType.CHECKUP, "완전다른이름", "하나병원", "검진", 10000, null
		));

		assertThat(nearMatch.getPetId()).isEqualTo(1L);
		assertThat(fallback.getPetId()).isEqualTo(1L);
	}
}
