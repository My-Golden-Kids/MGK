package com.mgk.bemgk.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.mgk.bemgk.dto.pet.CreatePetRequest;
import com.mgk.bemgk.dto.pet.PetResponse;
import com.mgk.bemgk.dto.pet.UpdatePetRequest;
import com.mgk.bemgk.dto.pet.WalkDtos.LiveWalkResponse;
import com.mgk.bemgk.dto.pet.WalkDtos.SaveWalkRequest;
import com.mgk.bemgk.dto.pet.WalkDtos.WalkRecordResponse;
import com.mgk.bemgk.dto.pet.WalkDtos.WalkResponse;
import com.mgk.bemgk.entity.Pet;
import com.mgk.bemgk.entity.PetSize;
import com.mgk.bemgk.entity.PetWalkRecord;
import com.mgk.bemgk.entity.User;
import com.mgk.bemgk.repository.AccountBookRepository;
import com.mgk.bemgk.repository.AccountRepository;
import com.mgk.bemgk.repository.CalendarRepository;
import com.mgk.bemgk.repository.MedicalDocumentRepository;
import com.mgk.bemgk.repository.PetRepository;
import com.mgk.bemgk.repository.PetWalkRecordRepository;
import com.mgk.bemgk.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PetService {

	private static final String DEFAULT_WALK_SOURCE = "MOBILE_HEALTH";
	private static final String CORE_MOTION_SOURCE_PREFIX = "CORE_MOTION_";

	private final PetRepository petRepository;
	private final PetWalkRecordRepository petWalkRecordRepository;
	private final AccountRepository accountRepository;
	private final AccountBookRepository accountBookRepository;
	private final CalendarRepository calendarRepository;
	private final MedicalDocumentRepository medicalDocumentRepository;
	private final UserRepository userRepository;
	private final CurrentUserService currentUserService;

	public PetResponse getPet(Long petId) {
		Long userId = currentUserService.getCurrentUserId();
		return PetResponse.from(findOwnedPet(petId, userId));
	}

	@Transactional
	public PetResponse updatePet(Long petId, UpdatePetRequest request) {
		Long userId = currentUserService.getCurrentUserId();
		Pet pet = findOwnedPet(petId, userId);
		PetSize petSize = null;
		if (request.size() != null) {
			try {
				petSize = PetSize.valueOf(request.size());
			} catch (IllegalArgumentException ignored) {
			}
		}
		pet.update(request.name(), request.age(), request.species(), petSize, request.imageUrl(), request.isDeath());
		return PetResponse.from(pet);
	}

	public List<PetResponse> getPets() {
		Long userId = currentUserService.getCurrentUserId();

		return petRepository.findByUser_Id(userId).stream()
			.map(PetResponse::from)
			.toList();
	}

	@Transactional
	public void deletePet(Long petId) {
		Long userId = currentUserService.getCurrentUserId();
		Pet pet = findOwnedPet(petId, userId);

		accountBookRepository.clearPetByPetId(pet.getId());
		petWalkRecordRepository.deleteByPet_Id(pet.getId());
		medicalDocumentRepository.deleteByPet_Id(pet.getId());
		calendarRepository.deleteByPet_Id(pet.getId());
		petRepository.delete(pet);
	}

	@Transactional
	public PetResponse createPet(CreatePetRequest request) {
		Long userId = currentUserService.getCurrentUserId();
		User user = userRepository.findById(userId)
			.orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
		PetSize petSize = null;
		if (request.size() != null) {
			try {
				petSize = PetSize.valueOf(request.size());
			} catch (IllegalArgumentException ignored) {
				throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"유효하지 않은 pet size 값입니다: " + request.size()
				);
			}
		}
		Pet pet = Pet.builder()
			.user(user)
			.name(request.name().trim())
			.image(request.imageUrl())
			.species(request.species())
			.age(request.age())
			.size(petSize)
			.walkCount(null)
			.walkTime(null)
			.death(Boolean.TRUE.equals(request.isDeath()))
			.deathDate(Boolean.TRUE.equals(request.isDeath()) ? LocalDateTime.now() : null)
			.lastWalkAt(null)
			.eatMeal(null)
			.build();

		return PetResponse.from(petRepository.save(pet));
	}

	@Transactional
	public WalkResponse saveWalk(Long petId, SaveWalkRequest request) {
		Long userId = currentUserService.getCurrentUserId();
		Pet pet = findOwnedPet(petId, userId);
		assertAlive(pet);
		LocalDateTime walkedAt = resolveWalkedAt(request);
		String source = resolveSource(request);
		PetWalkRecord walkRecord = getOrCreateWalkRecord(pet, walkedAt, source, request.getStatus());
		Integer syncedTotalStepCount = request.getStepCount();
		Integer syncedTotalWalkTimeSeconds = request.getWalkTimeSeconds();
		Double syncedTotalDistanceKm = request.getDistanceKm();
		String status = request.getStatus();
		boolean isCompleted = Boolean.TRUE.equals(request.getCompleted());
		int newStepCount = walkRecord.calculateNewStepCount(syncedTotalStepCount);
		int newWalkTimeSeconds = walkRecord.calculateNewWalkTimeSeconds(syncedTotalWalkTimeSeconds);

		if (source.startsWith(CORE_MOTION_SOURCE_PREFIX)) {
			walkRecord.updateLive(walkedAt, syncedTotalStepCount, syncedTotalWalkTimeSeconds, syncedTotalDistanceKm,
				status);

			if (isCompleted && !walkRecord.isCompleted()) {
				completeWalkRecord(userId, pet, walkRecord, walkedAt);
			}

			return buildWalkResponse(
				userId,
				pet,
				isCompleted ? syncedTotalStepCount : 0,
				syncedTotalStepCount,
				isCompleted ? syncedTotalWalkTimeSeconds : 0
			);
		}

		if (newStepCount > 0 || newWalkTimeSeconds > 0) {
			pet.addWalkRecord(newStepCount, newWalkTimeSeconds, walkedAt);
			walkRecord.updateLive(walkedAt, syncedTotalStepCount, syncedTotalWalkTimeSeconds, syncedTotalDistanceKm,
				status);
			walkRecord.markCompleted(walkedAt);
		}

		return buildWalkResponse(
			userId,
			pet,
			newStepCount,
			syncedTotalStepCount,
			newWalkTimeSeconds
		);
	}

	public LiveWalkResponse getLiveWalk(Long petId) {
		Long userId = currentUserService.getCurrentUserId();
		Pet pet = findOwnedPet(petId, userId);
		assertAlive(pet);

		LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
		LocalDateTime endOfDay = startOfDay.plusDays(1);

		return petWalkRecordRepository
			.findFirstByPet_IdAndWalkedAtBetweenAndSourceStartingWithOrderByUpdatedAtDesc(
				pet.getId(),
				startOfDay,
				endOfDay,
				CORE_MOTION_SOURCE_PREFIX
			)
			.map(walkRecord -> LiveWalkResponse.from(walkRecord, getTotalRewardAmount(userId)))
			.orElseGet(() -> LiveWalkResponse.builder()
				.petId(pet.getId())
				.stepCount(0)
				.walkTimeSeconds(0)
				.distanceKm(0.0)
				.completed(false)
				.status("IDLE")
				.totalRewardAmount(getTotalRewardAmount(userId))
				.build());
	}

	public List<WalkRecordResponse> getWalkRecords(Long petId) {
		Long userId = currentUserService.getCurrentUserId();
		Pet pet = findOwnedPet(petId, userId);

		return petWalkRecordRepository.findAllByPet_IdAndCompletedTrueOrderByWalkedAtDesc(pet.getId()).stream()
			.map(WalkRecordResponse::from)
			.toList();
	}

	private Pet findOwnedPet(Long petId, Long userId) {
		return petRepository.findByIdAndUser_Id(petId, userId)
			.orElseThrow(() -> new IllegalArgumentException("반려동물을 찾을 수 없습니다."));
	}

	private void assertAlive(Pet pet) {
		if (pet.isDead()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "사망한 반려동물은 이 기능을 사용할 수 없습니다.");
		}
	}

	private LocalDateTime resolveWalkedAt(SaveWalkRequest request) {
		return request.getWalkedAt() == null
			? LocalDateTime.now()
			: request.getWalkedAt().atZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime();
	}

	private String resolveSource(SaveWalkRequest request) {
		return request.getSource() == null || request.getSource().isBlank()
			? DEFAULT_WALK_SOURCE
			: request.getSource();
	}

	private PetWalkRecord getOrCreateWalkRecord(Pet pet, LocalDateTime walkedAt, String source, String status) {
		return petWalkRecordRepository
			.findByPet_IdAndSource(pet.getId(), source)
			.orElseGet(() -> petWalkRecordRepository.save(
				PetWalkRecord.createLive(pet, source, walkedAt, 0, 0, 0.0, status)
			));
	}

	private void completeWalkRecord(
		Long userId,
		Pet pet,
		PetWalkRecord walkRecord,
		LocalDateTime walkedAt
	) {
		pet.addWalkRecord(walkRecord.getStepCount(), walkRecord.getWalkTimeSeconds(), walkedAt);
		accountRepository.findFirstByUser_IdOrderByIdAsc(userId)
			.ifPresent(account -> account.addRewardAmount(BigDecimal.valueOf(walkRecord.getRewardAmount())));
		walkRecord.markCompleted(walkedAt);
	}

	private WalkResponse buildWalkResponse(
		Long userId,
		Pet pet,
		Integer savedStepCount,
		Integer syncedTotalStepCount,
		Integer savedWalkTimeSeconds
	) {
		return WalkResponse.of(
			pet,
			savedStepCount,
			syncedTotalStepCount,
			savedWalkTimeSeconds,
			getTotalRewardAmount(userId)
		);
	}

	private BigDecimal getTotalRewardAmount(Long userId) {
		return accountRepository.sumRewardAmountByUserId(userId);
	}
}
