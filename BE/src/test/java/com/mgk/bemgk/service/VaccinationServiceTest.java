package com.mgk.bemgk.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import com.mgk.bemgk.dto.vaccination.CreateScheduleRequest;
import com.mgk.bemgk.dto.vaccination.ScheduleCalendarEntry;
import com.mgk.bemgk.dto.vaccination.VaccinationPetSummaryResponse;
import com.mgk.bemgk.entity.CalendarEvent;
import com.mgk.bemgk.entity.MedicalDocument;
import com.mgk.bemgk.entity.MedicalDocumentType;
import com.mgk.bemgk.entity.Pet;
import com.mgk.bemgk.entity.User;
import com.mgk.bemgk.repository.CalendarRepository;
import com.mgk.bemgk.repository.MedicalDocumentRepository;
import com.mgk.bemgk.repository.PetRepository;

@ExtendWith(MockitoExtension.class)
class VaccinationServiceTest {

	@Mock
	private CalendarRepository calendarRepository;

	@Mock
	private PetRepository petRepository;

	@Mock
	private MedicalDocumentRepository medicalDocumentRepository;

	@InjectMocks
	private VaccinationService vaccinationService;

	@Test
	void getSchedules_groupsEventTypesByDateAndFiltersDeadPets() {
		User user = User.builder().name("user").email("user@test.com").password("pw").build();
		ReflectionTestUtils.setField(user, "id", 1L);
		Pet alivePet = Pet.builder().name("멩이").user(user).death(false).build();
		Pet deadPet = Pet.builder().name("돌멩이").user(user).death(true).build();

		when(calendarRepository.findByPet_User_IdAndDateBetweenOrderByDate(1L, LocalDate.of(2026, 4, 1), LocalDate.of(2026, 4, 30)))
			.thenReturn(List.of(
				CalendarEvent.builder().pet(alivePet).date(LocalDate.of(2026, 4, 20)).eventType("VACCINATION").name("종합백신").build(),
				CalendarEvent.builder().pet(alivePet).date(LocalDate.of(2026, 4, 20)).eventType("CHECKUP").name("검진").build(),
				CalendarEvent.builder().pet(deadPet).date(LocalDate.of(2026, 4, 21)).eventType("VACCINATION").name("광견병").build()
			));

		List<ScheduleCalendarEntry> result = vaccinationService.getSchedules(1L, 2026, 4);

		assertThat(result).hasSize(1);
		assertThat(result.getFirst().getDate()).isEqualTo("2026-04-20");
		assertThat(result.getFirst().getEventTypes()).containsExactlyInAnyOrder("VACCINATION", "CHECKUP");
	}

	@Test
	void createSchedule_throwsForDeadPet() {
		User user = User.builder().name("user").email("user@test.com").password("pw").build();
		ReflectionTestUtils.setField(user, "id", 1L);
		Pet deadPet = Pet.builder().name("돌멩이").user(user).death(true).build();
		ReflectionTestUtils.setField(deadPet, "id", 2L);

		when(petRepository.findById(2L)).thenReturn(Optional.of(deadPet));

		assertThatThrownBy(() -> vaccinationService.createSchedule(1L, buildScheduleRequest(2L)))
			.isInstanceOf(ResponseStatusException.class);
	}

	@Test
	void getSummary_buildsVaccinationHistoryAndNextSchedule() {
		User user = User.builder().name("user").email("user@test.com").password("pw").build();
		ReflectionTestUtils.setField(user, "id", 1L);
		Pet pet = Pet.builder().name("멩이").user(user).image("https://image").death(false).build();
		ReflectionTestUtils.setField(pet, "id", 1L);

		CalendarEvent nextEvent = CalendarEvent.builder()
			.pet(pet)
			.name("종합백신 2차 접종")
			.date(LocalDate.now().plusDays(10))
			.memo("추가 일정")
			.eventType("VACCINATION")
			.build();

		MedicalDocument document = new MedicalDocument();
		ReflectionTestUtils.setField(document, "pet", pet);
		ReflectionTestUtils.setField(document, "date", LocalDate.now().minusDays(30));
		ReflectionTestUtils.setField(document, "type", MedicalDocumentType.VACCINATION);
		ReflectionTestUtils.setField(document, "details", "종합백신 1차 접종");

		when(petRepository.findByUser_Id(1L)).thenReturn(List.of(pet));
		when(calendarRepository.findFirstByPet_IdAndDateGreaterThanEqualOrderByDateAsc(1L, LocalDate.now()))
			.thenReturn(Optional.of(nextEvent));
		when(calendarRepository.findByPet_IdAndEventTypeAndDateGreaterThanEqualOrderByDateAsc(1L, "VACCINATION", LocalDate.now()))
			.thenReturn(List.of(nextEvent));
		when(medicalDocumentRepository.findByPet_IdAndTypeOrderByDateDescCreatedAtDesc(1L, MedicalDocumentType.VACCINATION))
			.thenReturn(List.of(document));

		List<VaccinationPetSummaryResponse> result = vaccinationService.getSummary(1L);

		assertThat(result).hasSize(1);
		assertThat(result.getFirst().getPetName()).isEqualTo("멩이");
		assertThat(result.getFirst().getLatestScheduleLabel()).contains("종합백신 2차 접종");
		assertThat(result.getFirst().getVaccinationItems()).hasSize(1);
		assertThat(result.getFirst().getVaccinationItems().getFirst().getHistory()).hasSize(2);
	}

	private CreateScheduleRequest buildScheduleRequest(Long petId) {
		CreateScheduleRequest request = new CreateScheduleRequest();
		ReflectionTestUtils.setField(request, "petId", petId);
		ReflectionTestUtils.setField(request, "eventType", "VACCINATION");
		ReflectionTestUtils.setField(request, "date", LocalDate.now().plusDays(1));
		ReflectionTestUtils.setField(request, "name", "종합백신");
		ReflectionTestUtils.setField(request, "memo", "메모");
		return request;
	}
}
