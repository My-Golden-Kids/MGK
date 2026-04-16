package com.mgk.bemgk.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import com.mgk.bemgk.dto.pet.CreatePetRequest;
import com.mgk.bemgk.dto.pet.PetResponse;
import com.mgk.bemgk.dto.pet.UpdatePetRequest;
import com.mgk.bemgk.dto.pet.WalkDtos.LiveWalkResponse;
import com.mgk.bemgk.dto.pet.WalkDtos.SaveWalkRequest;
import com.mgk.bemgk.dto.pet.WalkDtos.WalkRecordResponse;
import com.mgk.bemgk.dto.pet.WalkDtos.WalkResponse;
import com.mgk.bemgk.entity.Account;
import com.mgk.bemgk.entity.Pet;
import com.mgk.bemgk.entity.PetWalkRecord;
import com.mgk.bemgk.entity.User;
import com.mgk.bemgk.repository.AccountBookRepository;
import com.mgk.bemgk.repository.AccountRepository;
import com.mgk.bemgk.repository.CalendarRepository;
import com.mgk.bemgk.repository.MedicalDocumentRepository;
import com.mgk.bemgk.repository.PetRepository;
import com.mgk.bemgk.repository.PetWalkRecordRepository;
import com.mgk.bemgk.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class PetServiceTest {

	@Mock
	private PetRepository petRepository;
	@Mock
	private PetWalkRecordRepository petWalkRecordRepository;
	@Mock
	private AccountRepository accountRepository;
	@Mock
	private AccountBookRepository accountBookRepository;
	@Mock
	private CalendarRepository calendarRepository;
	@Mock
	private MedicalDocumentRepository medicalDocumentRepository;
	@Mock
	private UserRepository userRepository;
	@Mock
	private CurrentUserService currentUserService;

	@InjectMocks
	private PetService petService;

	@Test
	void createGetUpdateDeletePet_coverCrudBranches() {
		User user = User.builder().name("tester").email("t@test.com").password("pw").build();
		ReflectionTestUtils.setField(user, "id", 1L);
		Pet pet = Pet.builder().user(user).name("멩이").species("DOG").death(false).build();
		ReflectionTestUtils.setField(pet, "id", 2L);

		when(currentUserService.getCurrentUserId()).thenReturn(1L);
		when(userRepository.findById(1L)).thenReturn(Optional.of(user));
		when(petRepository.save(any(Pet.class))).thenAnswer(invocation -> {
			Pet saved = invocation.getArgument(0);
			ReflectionTestUtils.setField(saved, "id", 2L);
			return saved;
		});
		when(petRepository.findByIdAndUser_Id(2L, 1L)).thenReturn(Optional.of(pet));
		when(petRepository.findByUser_Id(1L)).thenReturn(List.of(pet));

		PetResponse created = petService.createPet(new CreatePetRequest(" 멩이 ", "https://img", 3.0, "DOG", "소형", false));
		PetResponse fetched = petService.getPet(2L);
		List<PetResponse> pets = petService.getPets();
		PetResponse updated = petService.updatePet(2L, new UpdatePetRequest("멩이2", 4.0, "CAT", "중형", "https://new", false));
		petService.deletePet(2L);

		assertThat(created.getId()).isEqualTo(2L);
		assertThat(fetched.getName()).isEqualTo("멩이");
		assertThat(pets).hasSize(1);
		assertThat(updated.getName()).isEqualTo("멩이2");
		verify(accountBookRepository).clearPetByPetId(2L);
		verify(petWalkRecordRepository).deleteByPet_Id(2L);
		verify(medicalDocumentRepository).deleteByPet_Id(2L);
		verify(calendarRepository).deleteByPet_Id(2L);
		verify(petRepository).delete(pet);
	}

	@Test
	void createPet_throwsForInvalidSize() {
		User user = User.builder().name("tester").email("t@test.com").password("pw").build();
		when(currentUserService.getCurrentUserId()).thenReturn(1L);
		when(userRepository.findById(1L)).thenReturn(Optional.of(user));

		assertThatThrownBy(() -> petService.createPet(
			new CreatePetRequest("멩이", null, 3.0, "DOG", "INVALID", false)
		)).isInstanceOf(ResponseStatusException.class);
	}

	@Test
	void saveWalkAndReadLiveWalkRecords_coverNormalAndCoreMotionPaths() {
		Account account = Account.builder()
			.rewardAmount(BigDecimal.ZERO)
			.totalAmount(BigDecimal.ZERO)
			.moneyAmount(BigDecimal.ZERO)
			.build();
		Pet pet = Pet.builder().name("멩이").species("DOG").age(3.0).death(false).walkCount(0).walkTime(0).build();
		ReflectionTestUtils.setField(pet, "id", 1L);

		when(currentUserService.getCurrentUserId()).thenReturn(1L);
		when(petRepository.findByIdAndUser_Id(1L, 1L)).thenReturn(Optional.of(pet));
		when(accountRepository.sumRewardAmountByUserId(1L)).thenReturn(BigDecimal.valueOf(3));
		when(accountRepository.findFirstByUser_IdOrderByIdAsc(1L)).thenReturn(Optional.of(account));

		SaveWalkRequest coreMotionRequest = new SaveWalkRequest();
		ReflectionTestUtils.setField(coreMotionRequest, "stepCount", 6000);
		ReflectionTestUtils.setField(coreMotionRequest, "walkTimeSeconds", 1800);
		ReflectionTestUtils.setField(coreMotionRequest, "distanceKm", 2.5);
		ReflectionTestUtils.setField(coreMotionRequest, "walkedAt", OffsetDateTime.parse("2026-04-16T10:00:00+09:00"));
		ReflectionTestUtils.setField(coreMotionRequest, "source", "CORE_MOTION_123");
		ReflectionTestUtils.setField(coreMotionRequest, "completed", true);
		ReflectionTestUtils.setField(coreMotionRequest, "status", "COMPLETED");

		when(petWalkRecordRepository.findByPet_IdAndSource(1L, "CORE_MOTION_123")).thenReturn(Optional.empty());
		when(petWalkRecordRepository.save(any(PetWalkRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));

		WalkResponse coreMotionResponse = petService.saveWalk(1L, coreMotionRequest);
		assertThat(coreMotionResponse.getSavedStepCount()).isEqualTo(6000);
		assertThat(coreMotionResponse.getTotalRewardAmount()).isEqualByComparingTo("3");

		PetWalkRecord liveRecord = PetWalkRecord.createLive(
			pet, "CORE_MOTION_123", LocalDateTime.now(), 1200, 300, 0.8, "WALKING"
		);
		when(petWalkRecordRepository.findFirstByPet_IdAndWalkedAtBetweenAndSourceStartingWithOrderByUpdatedAtDesc(any(), any(), any(), any()))
			.thenReturn(Optional.of(liveRecord));
		LiveWalkResponse liveWalk = petService.getLiveWalk(1L);
		assertThat(liveWalk.getStatus()).isEqualTo("WALKING");

		PetWalkRecord completedRecord = PetWalkRecord.create(
			pet, "APP", LocalDateTime.now(), 3000, 900, 1.2
		);
		ReflectionTestUtils.setField(completedRecord, "id", 7L);
		when(petWalkRecordRepository.findAllByPet_IdAndCompletedTrueOrderByWalkedAtDesc(1L))
			.thenReturn(List.of(completedRecord));
		List<WalkRecordResponse> records = petService.getWalkRecords(1L);
		assertThat(records).hasSize(1);
		assertThat(records.getFirst().getId()).isEqualTo(7L);
	}

	@Test
	void getLiveWalk_returnsIdleAndSaveWalk_throwsForDeadPet() {
		Pet alivePet = Pet.builder().name("멩이").death(false).build();
		ReflectionTestUtils.setField(alivePet, "id", 1L);
		when(currentUserService.getCurrentUserId()).thenReturn(1L);
		when(petRepository.findByIdAndUser_Id(1L, 1L)).thenReturn(Optional.of(alivePet));
		when(accountRepository.sumRewardAmountByUserId(1L)).thenReturn(BigDecimal.ZERO);
		when(petWalkRecordRepository.findFirstByPet_IdAndWalkedAtBetweenAndSourceStartingWithOrderByUpdatedAtDesc(any(), any(), any(), any()))
			.thenReturn(Optional.empty());

		LiveWalkResponse idle = petService.getLiveWalk(1L);
		assertThat(idle.getStatus()).isEqualTo("IDLE");

		Pet deadPet = Pet.builder().name("돌멩이").death(true).build();
		when(petRepository.findByIdAndUser_Id(1L, 1L)).thenReturn(Optional.of(deadPet));
		SaveWalkRequest request = new SaveWalkRequest();
		ReflectionTestUtils.setField(request, "stepCount", 100);

		assertThatThrownBy(() -> petService.saveWalk(1L, request))
			.isInstanceOf(ResponseStatusException.class);
	}
}
