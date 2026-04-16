package com.mgk.bemgk.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import com.mgk.bemgk.dto.alarm.FeedingAlarmDto;
import com.mgk.bemgk.dto.feeding.FeedingScheduleRequest;
import com.mgk.bemgk.dto.feeding.FeedingScheduleResponse;
import com.mgk.bemgk.entity.FeedingSchedule;
import com.mgk.bemgk.entity.Pet;
import com.mgk.bemgk.repository.FeedingScheduleRepository;
import com.mgk.bemgk.repository.PetRepository;

@ExtendWith(MockitoExtension.class)
class FeedingScheduleServiceTest {

	@Mock
	private FeedingScheduleRepository feedingScheduleRepository;

	@Mock
	private PetRepository petRepository;

	@Mock
	private CurrentUserService currentUserService;

	@InjectMocks
	private FeedingScheduleService feedingScheduleService;

	@Test
	void createSchedule_savesAndReturnsSchedule() {
		Long userId = 1L;
		Pet pet = Pet.builder().name("멩이").species("DOG").age(3.0).build();
		ReflectionTestUtils.setField(pet, "id", 1L);

		FeedingScheduleRequest request = new FeedingScheduleRequest();
		ReflectionTestUtils.setField(request, "firstFeedTime", LocalTime.of(7, 0));
		ReflectionTestUtils.setField(request, "mealsPerDay", 3);
		ReflectionTestUtils.setField(request, "customAmountG", 90);

		when(currentUserService.getCurrentUserId()).thenReturn(userId);
		when(petRepository.findByIdAndUser_Id(1L, userId)).thenReturn(Optional.of(pet));
		when(feedingScheduleRepository.findByPetId(1L)).thenReturn(Optional.empty());
		when(feedingScheduleRepository.save(any(FeedingSchedule.class))).thenAnswer(invocation -> invocation.getArgument(0));

		FeedingScheduleResponse response = feedingScheduleService.createSchedule(1L, request);

		assertThat(response.getPetName()).isEqualTo("멩이");
		assertThat(response.getMealsPerDay()).isEqualTo(3);
		assertThat(response.getPerMealAmountG()).isEqualTo(30);
	}

	@Test
	void getFeedingAlarms_buildsAlarmPerFeedTime() {
		Pet dog = Pet.builder().name("멩이").species("DOG").age(3.0).build();
		ReflectionTestUtils.setField(dog, "id", 1L);
		FeedingSchedule schedule = FeedingSchedule.builder()
			.pet(dog)
			.firstFeedTime(LocalTime.of(8, 0))
			.mealsPerDay(2)
			.customAmountG(100)
			.build();

		when(feedingScheduleRepository.findByPet_User_IdAndPet_DeathFalse(1L)).thenReturn(List.of(schedule));

		List<FeedingAlarmDto> alarms = feedingScheduleService.getFeedingAlarms(1L);

		assertThat(alarms).hasSize(2);
		assertThat(alarms.getFirst().getAmountGram()).isEqualTo(50);
		assertThat(alarms.get(1).getFeedTime()).isEqualTo(LocalTime.of(20, 0));
	}

	@Test
	void helperMethods_validateSpeciesAndMeals() {
		assertThat(feedingScheduleService.calculateFeedTimes(LocalTime.of(8, 0), "CAT", 3))
			.containsExactly(LocalTime.of(8, 0), LocalTime.of(16, 0), LocalTime.of(0, 0));
		assertThat(feedingScheduleService.getDailyAmountGram("DOG", 5.0)).isEqualTo(450);
		assertThat(feedingScheduleService.getPerMealAmountGram("CAT", 8.0, 2)).isEqualTo(32);
		assertThatThrownBy(() -> feedingScheduleService.getIntervalHours("DOG", 5))
			.isInstanceOf(IllegalArgumentException.class);
	}

	@Test
	void getSchedule_updateAndDelete_useOwnedSchedule() {
		Long userId = 1L;
		Pet pet = Pet.builder().name("멩이").species("DOG").age(3.0).build();
		ReflectionTestUtils.setField(pet, "id", 1L);
		FeedingSchedule schedule = FeedingSchedule.builder()
			.pet(pet)
			.firstFeedTime(LocalTime.of(8, 0))
			.mealsPerDay(2)
			.customAmountG(null)
			.build();

		FeedingScheduleRequest updateRequest = new FeedingScheduleRequest();
		ReflectionTestUtils.setField(updateRequest, "firstFeedTime", LocalTime.of(9, 0));
		ReflectionTestUtils.setField(updateRequest, "mealsPerDay", 4);
		ReflectionTestUtils.setField(updateRequest, "customAmountG", 120);

		when(currentUserService.getCurrentUserId()).thenReturn(userId);
		when(petRepository.findByIdAndUser_Id(1L, userId)).thenReturn(Optional.of(pet));
		when(feedingScheduleRepository.findByPetId(1L)).thenReturn(Optional.of(schedule));

		FeedingScheduleResponse current = feedingScheduleService.getSchedule(1L);
		FeedingScheduleResponse updated = feedingScheduleService.updateSchedule(1L, updateRequest);
		feedingScheduleService.deleteSchedule(1L);

		assertThat(current.getPerMealAmountG()).isEqualTo(225);
		assertThat(updated.getFirstFeedTime()).isEqualTo(LocalTime.of(9, 0));
		assertThat(updated.getMealsPerDay()).isEqualTo(4);
		assertThat(updated.getPerMealAmountG()).isEqualTo(30);
		verify(feedingScheduleRepository).delete(schedule);
	}

	@Test
	void getFeedingAlarms_returnsNullGramWhenPetInfoMissing() {
		Pet pet = Pet.builder().name("멩이").species(null).age(null).build();
		ReflectionTestUtils.setField(pet, "id", 1L);
		FeedingSchedule schedule = FeedingSchedule.builder()
			.pet(pet)
			.firstFeedTime(LocalTime.of(8, 0))
			.mealsPerDay(2)
			.customAmountG(null)
			.build();

		when(feedingScheduleRepository.findByPet_User_IdAndPet_DeathFalse(1L)).thenReturn(List.of(schedule));

		List<FeedingAlarmDto> alarms = feedingScheduleService.getFeedingAlarms(1L);

		assertThat(alarms).hasSize(2);
		assertThat(alarms.getFirst().getAmountGram()).isNull();
	}
}
