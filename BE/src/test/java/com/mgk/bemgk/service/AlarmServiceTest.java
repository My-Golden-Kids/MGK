package com.mgk.bemgk.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.mgk.bemgk.dto.alarm.AlarmResponse;
import com.mgk.bemgk.dto.alarm.FeedingAlarmDto;
import com.mgk.bemgk.entity.CalendarEvent;
import com.mgk.bemgk.entity.Pet;
import com.mgk.bemgk.entity.PetWalkRecord;
import com.mgk.bemgk.repository.CalendarRepository;
import com.mgk.bemgk.repository.PetWalkRecordRepository;

@ExtendWith(MockitoExtension.class)
class AlarmServiceTest {

	@Mock
	private PetWalkRecordRepository petWalkRecordRepository;

	@Mock
	private CalendarRepository calendarRepository;

	@Mock
	private FeedingScheduleService feedingScheduleService;

	@Mock
	private CurrentUserService currentUserService;

	@InjectMocks
	private AlarmService alarmService;

	@Test
	void getAlarms_returnsMostFrequentWalkHourAndFiltersDeadPets() {
		Long userId = 1L;
		Pet alivePet = Pet.builder().name("멩이").death(false).build();
		Pet deadPet = Pet.builder().name("돌멩이").death(true).build();
		ReflectionTestUtils.setField(alivePet, "id", 1L);
		ReflectionTestUtils.setField(deadPet, "id", 2L);

		PetWalkRecord morningWalk = PetWalkRecord.create(alivePet, "APP", LocalDateTime.of(2026, 4, 16, 8, 0), 3000, 600, 1.0);
		PetWalkRecord secondMorningWalk = PetWalkRecord.create(alivePet, "APP2", LocalDateTime.of(2026, 4, 15, 8, 30), 3000, 600, 1.0);
		PetWalkRecord deadPetWalk = PetWalkRecord.create(deadPet, "APP3", LocalDateTime.of(2026, 4, 16, 20, 0), 3000, 600, 1.0);
		PetWalkRecord missingTimeWalk = PetWalkRecord.create(alivePet, "APP4", LocalDateTime.of(2026, 4, 16, 9, 0), 3000, 600, 1.0);
		ReflectionTestUtils.setField(missingTimeWalk, "walkedAt", null);

		CalendarEvent aliveEvent = CalendarEvent.builder()
			.pet(alivePet)
			.name("예방접종")
			.date(LocalDate.now())
			.eventType("VACCINATION")
			.build();
		CalendarEvent deadEvent = CalendarEvent.builder()
			.pet(deadPet)
			.name("검진")
			.date(LocalDate.now())
			.eventType("CHECKUP")
			.build();

		when(currentUserService.getCurrentUserId()).thenReturn(userId);
		when(petWalkRecordRepository.findAllByPet_User_IdAndCompletedTrue(userId))
			.thenReturn(List.of(morningWalk, secondMorningWalk, deadPetWalk, missingTimeWalk));
		when(calendarRepository.findByPet_User_IdAndDateOrderByDate(userId, LocalDate.now()))
			.thenReturn(List.of(aliveEvent, deadEvent));
		when(feedingScheduleService.getFeedingAlarms(userId))
			.thenReturn(List.of(FeedingAlarmDto.builder()
				.petId(1L)
				.petName("멩이")
				.feedTime(LocalTime.of(8, 0))
				.amountGram(50)
				.build()));

		AlarmResponse response = alarmService.getAlarms();

		assertThat(response.getMostFrequentWalkHour()).isEqualTo(8);
		assertThat(response.getTodayEvents()).hasSize(1);
		assertThat(response.getTodayEvents().getFirst().getPetName()).isEqualTo("멩이");
		assertThat(response.getFeedingAlarms()).hasSize(1);
	}
}
