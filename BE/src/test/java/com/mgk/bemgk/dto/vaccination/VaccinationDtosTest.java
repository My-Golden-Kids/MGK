package com.mgk.bemgk.dto.vaccination;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class VaccinationDtosTest {

	@Test
	void vaccinationDtosExposeValues() {
		CreateScheduleRequest request = new CreateScheduleRequest();
		ReflectionTestUtils.setField(request, "petId", 1L);
		ReflectionTestUtils.setField(request, "eventType", "VACCINATION");
		ReflectionTestUtils.setField(request, "date", LocalDate.of(2026, 4, 20));
		ReflectionTestUtils.setField(request, "name", "종합백신");
		ReflectionTestUtils.setField(request, "memo", "추가 메모");

		VaccinationHistoryItem historyItem = VaccinationHistoryItem.builder()
			.date("2026-04-20")
			.completed(true)
			.memo("완료")
			.build();
		VaccinationItemResponse itemResponse = VaccinationItemResponse.builder()
			.id("core")
			.title("종합백신")
			.totalCount(3)
			.lastDate("2026-01-01")
			.nextDate("2026-04-20")
			.history(List.of(historyItem))
			.build();
		ScheduleCalendarEntry calendarEntry = ScheduleCalendarEntry.builder()
			.date("2026-04-20")
			.eventTypes(List.of("VACCINATION"))
			.build();
		VaccinationPetSummaryResponse summaryResponse = VaccinationPetSummaryResponse.builder()
			.petId(1L)
			.petName("멩이")
			.petImageUrl("https://image")
			.latestScheduleLabel("종합백신 1건")
			.vaccinationItems(List.of(itemResponse))
			.build();

		assertThat(request.getPetId()).isEqualTo(1L);
		assertThat(request.getEventType()).isEqualTo("VACCINATION");
		assertThat(request.getDate()).isEqualTo(LocalDate.of(2026, 4, 20));
		assertThat(request.getName()).isEqualTo("종합백신");
		assertThat(request.getMemo()).isEqualTo("추가 메모");
		assertThat(historyItem.isCompleted()).isTrue();
		assertThat(itemResponse.getHistory()).containsExactly(historyItem);
		assertThat(calendarEntry.getEventTypes()).containsExactly("VACCINATION");
		assertThat(summaryResponse.getPetName()).isEqualTo("멩이");
		assertThat(summaryResponse.getVaccinationItems()).containsExactly(itemResponse);
	}
}
