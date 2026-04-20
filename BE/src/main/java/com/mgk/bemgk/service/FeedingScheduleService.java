package com.mgk.bemgk.service;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.IntStream;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.mgk.bemgk.dto.alarm.FeedingAlarmDto;
import com.mgk.bemgk.dto.feeding.FeedingScheduleRequest;
import com.mgk.bemgk.dto.feeding.FeedingScheduleResponse;
import com.mgk.bemgk.entity.FeedingSchedule;
import com.mgk.bemgk.entity.Pet;
import com.mgk.bemgk.repository.FeedingScheduleRepository;
import com.mgk.bemgk.repository.PetRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FeedingScheduleService {

	private final FeedingScheduleRepository feedingScheduleRepository;
	private final PetRepository petRepository;
	private final CurrentUserService currentUserService;

	// ──────────────────────────────────────────
	// CRUD
	// ──────────────────────────────────────────

	public List<FeedingScheduleResponse> getSchedules() {
		Long userId = currentUserService.getCurrentUserId();
		return feedingScheduleRepository.findByPet_User_IdAndPet_DeathFalse(userId)
			.stream()
			.map(this::toResponse)
			.toList();
	}

	public FeedingScheduleResponse getSchedule(Long petId) {
		Long userId = currentUserService.getCurrentUserId();
		FeedingSchedule schedule = findScheduleForUser(petId, userId);
		return toResponse(schedule);
	}

	@Transactional
	public FeedingScheduleResponse createSchedule(Long petId, FeedingScheduleRequest request) {
		Long userId = currentUserService.getCurrentUserId();
		Pet pet = petRepository.findByIdAndUser_Id(petId, userId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "펫을 찾을 수 없습니다."));

		if (feedingScheduleRepository.findByPetId(petId).isPresent()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 급여 스케줄이 등록된 펫입니다.");
		}

		validateMealsPerDay(pet.getSpecies(), request.getMealsPerDay());

		FeedingSchedule schedule = FeedingSchedule.builder()
			.pet(pet)
			.firstFeedTime(request.getFirstFeedTime())
			.mealsPerDay(request.getMealsPerDay())
			.customAmountG(request.getCustomAmountG())
			.build();

		return toResponse(feedingScheduleRepository.save(schedule));
	}

	@Transactional
	public FeedingScheduleResponse updateSchedule(Long petId, FeedingScheduleRequest request) {
		Long userId = currentUserService.getCurrentUserId();
		FeedingSchedule schedule = findScheduleForUser(petId, userId);

		validateMealsPerDay(schedule.getPet().getSpecies(), request.getMealsPerDay());
		schedule.update(request.getFirstFeedTime(), request.getMealsPerDay(), request.getCustomAmountG());
		return toResponse(schedule);
	}

	@Transactional
	public void deleteSchedule(Long petId) {
		Long userId = currentUserService.getCurrentUserId();
		FeedingSchedule schedule = findScheduleForUser(petId, userId);
		feedingScheduleRepository.delete(schedule);
	}

	// ──────────────────────────────────────────
	// 알람용 데이터
	// ──────────────────────────────────────────

	public List<FeedingAlarmDto> getFeedingAlarms(Long userId) {
		List<FeedingSchedule> schedules =
			feedingScheduleRepository.findByPet_User_IdAndPet_DeathFalse(userId);

		List<FeedingAlarmDto> alarms = new ArrayList<>();
		for (FeedingSchedule schedule : schedules) {
			Pet pet = schedule.getPet();
			List<LocalTime> feedTimes = calculateFeedTimes(
				schedule.getFirstFeedTime(), pet.getSpecies(), schedule.getMealsPerDay());
			Integer amountGram = resolvePerMealAmount(schedule, pet);

			for (LocalTime feedTime : feedTimes) {
				alarms.add(FeedingAlarmDto.builder()
					.petId(pet.getId())
					.petName(pet.getName())
					.feedTime(feedTime)
					.amountGram(amountGram)
					.build());
			}
		}
		return alarms;
	}

	// ──────────────────────────────────────────
	// 급여 시간 계산
	// ──────────────────────────────────────────

	public List<LocalTime> calculateFeedTimes(LocalTime firstFeedTime, String species, int meals) {
		int interval = getIntervalHours(species, meals);
		return IntStream.range(0, meals)
			.mapToObj(i -> firstFeedTime.plusHours((long)i * interval))
			.toList();
	}

	public int getIntervalHours(String species, int meals) {
		if (species == null) {
			species = "DOG";
		}
		return switch (normalizeSpecies(species) + "_" + meals) {
			case "DOG_2" -> 12;
			case "DOG_3" -> 8;
			case "DOG_4" -> 6;
			case "CAT_2" -> 12;
			case "CAT_3" -> 8;
			case "CAT_4" -> 6;
			default -> throw new IllegalArgumentException(
				"지원하지 않는 급여 횟수입니다. (종: " + species + ", 횟수: " + meals + ")");
		};
	}

	private String normalizeSpecies(String species) {
		return switch (species.trim().toUpperCase()) {
			case "강아지", "DOG" -> "DOG";
			case "고양이", "CAT" -> "CAT";
			default -> species.toUpperCase();
		};
	}

	// ──────────────────────────────────────────
	// 급여량 계산
	// ──────────────────────────────────────────

	public int getDailyAmountGram(String species, Double age) {
		if (species == null || age == null) {
			throw new IllegalArgumentException("종(species) 또는 나이 정보가 없습니다.");
		}
		return switch (normalizeSpecies(species)) {
			case "DOG" -> {
				if (age <= 2) {
					yield 350;
				}
				if (age <= 9) {
					yield 450;
				}
				yield 350;
			}
			case "CAT" -> age < 10 ? 65 : 55;
			default -> throw new IllegalArgumentException("지원하지 않는 종입니다: " + species);
		};
	}

	public int getPerMealAmountGram(String species, Double age, int meals) {
		return getDailyAmountGram(species, age) / meals;
	}

	// ──────────────────────────────────────────
	// 내부 헬퍼
	// ──────────────────────────────────────────

	private FeedingSchedule findScheduleForUser(Long petId, Long userId) {
		// 펫 소유권 확인
		petRepository.findByIdAndUser_Id(petId, userId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "펫을 찾을 수 없습니다."));

		return feedingScheduleRepository.findByPetId(petId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "급여 스케줄이 없습니다."));
	}

	private Integer resolvePerMealAmount(FeedingSchedule schedule, Pet pet) {
		if (schedule.getCustomAmountG() != null) {
			return schedule.getCustomAmountG() / schedule.getMealsPerDay();
		}
		try {
			return getPerMealAmountGram(pet.getSpecies(), pet.getAge(), schedule.getMealsPerDay());
		} catch (IllegalArgumentException e) {
			return null; // species/age 정보 부족 시 g 표시 생략
		}
	}

	private FeedingScheduleResponse toResponse(FeedingSchedule schedule) {
		Pet pet = schedule.getPet();
		List<LocalTime> feedTimes = calculateFeedTimes(
			schedule.getFirstFeedTime(), pet.getSpecies(), schedule.getMealsPerDay());
		int perMealAmount;
		try {
			perMealAmount = schedule.getCustomAmountG() != null
				? schedule.getCustomAmountG() / schedule.getMealsPerDay()
				: getPerMealAmountGram(pet.getSpecies(), pet.getAge(), schedule.getMealsPerDay());
		} catch (IllegalArgumentException e) {
			perMealAmount = 0;
		}
		return FeedingScheduleResponse.of(schedule, perMealAmount, feedTimes);
	}

	private void validateMealsPerDay(String species, int meals) {
		// 유효한 조합인지 검사 (getIntervalHours가 예외 던짐)
		getIntervalHours(species, meals);
	}
}
