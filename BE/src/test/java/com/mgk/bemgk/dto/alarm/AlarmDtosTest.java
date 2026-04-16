package com.mgk.bemgk.dto.alarm;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.mgk.bemgk.entity.CalendarEvent;
import com.mgk.bemgk.entity.Pet;

class AlarmDtosTest {

	@Test
	void alarmDtosExposeFieldsAndMapping() {
		Pet pet = Pet.builder().name("멩이").build();
		ReflectionTestUtils.setField(pet, "id", 3L);

		TodayCalendarEventDto eventDto = TodayCalendarEventDto.from(CalendarEvent.builder()
			.pet(pet)
			.name("예방접종")
			.date(LocalDate.of(2026, 4, 16))
			.eventType("VACCINATION")
			.build());

		FeedingAlarmDto feedingAlarmDto = FeedingAlarmDto.builder()
			.petId(3L)
			.petName("멩이")
			.feedTime(LocalTime.of(8, 30))
			.amountGram(70)
			.build();

		AlarmResponse alarmResponse = AlarmResponse.builder()
			.mostFrequentWalkHour(20)
			.todayEvents(List.of(eventDto))
			.feedingAlarms(List.of(feedingAlarmDto))
			.build();

		assertThat(eventDto.getPetId()).isEqualTo(3L);
		assertThat(eventDto.getPetName()).isEqualTo("멩이");
		assertThat(eventDto.getName()).isEqualTo("예방접종");
		assertThat(eventDto.getEventType()).isEqualTo("VACCINATION");
		assertThat(feedingAlarmDto.getPetId()).isEqualTo(3L);
		assertThat(feedingAlarmDto.getPetName()).isEqualTo("멩이");
		assertThat(feedingAlarmDto.getFeedTime()).isEqualTo(LocalTime.of(8, 30));
		assertThat(feedingAlarmDto.getAmountGram()).isEqualTo(70);
		assertThat(alarmResponse.getMostFrequentWalkHour()).isEqualTo(20);
		assertThat(alarmResponse.getTodayEvents()).containsExactly(eventDto);
		assertThat(alarmResponse.getFeedingAlarms()).containsExactly(feedingAlarmDto);
	}
}
