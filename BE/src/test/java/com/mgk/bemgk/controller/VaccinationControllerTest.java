package com.mgk.bemgk.controller;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mgk.bemgk.dto.vaccination.ScheduleCalendarEntry;
import com.mgk.bemgk.dto.vaccination.VaccinationPetSummaryResponse;
import com.mgk.bemgk.service.VaccinationService;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class VaccinationControllerTest {

	private MockMvc mockMvc;

	@Mock
	private VaccinationService vaccinationService;

	@InjectMocks
	private VaccinationController vaccinationController;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(vaccinationController).build();
		SecurityContextHolder.clearContext();
	}

	@AfterEach
	void tearDown() {
		SecurityContextHolder.clearContext();
	}

	@Test
	void endpoints_requireAuthentication() throws Exception {
		mockMvc.perform(get("/api/vaccinations/summary"))
			.andExpect(status().isUnauthorized());
	}

	@Test
	void schedulesAndSummary_returnPayload() throws Exception {
		when(vaccinationService.getSchedules(1L, 2026, 4)).thenReturn(List.of(ScheduleCalendarEntry.builder()
			.date("2026-04-16")
			.eventTypes(List.of("VACCINATION"))
			.build()));
		when(vaccinationService.getSummary(1L)).thenReturn(List.of(VaccinationPetSummaryResponse.builder()
			.petId(1L)
			.petName("멩이")
			.latestScheduleLabel("다음 접종")
			.vaccinationItems(List.of())
			.build()));

		mockMvc.perform(get("/api/vaccinations/schedules")
				.with(withUserId(1L))
				.param("year", "2026")
				.param("month", "4"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].date").value("2026-04-16"));

		mockMvc.perform(post("/api/vaccinations/schedules")
				.with(withUserId(1L))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"petId":1,"eventType":"VACCINATION","date":"2026-04-16","name":"광견병","memo":"메모"}
					"""))
			.andExpect(status().isCreated());
		verify(vaccinationService).createSchedule(org.mockito.ArgumentMatchers.eq(1L), org.mockito.ArgumentMatchers.any());

		mockMvc.perform(get("/api/vaccinations/summary").with(withUserId(1L)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].petName").value("멩이"));
	}

	private RequestPostProcessor withUserId(Long userId) {
		return (MockHttpServletRequest request) -> {
			SecurityContextHolder.getContext()
				.setAuthentication(new UsernamePasswordAuthenticationToken(userId, null, List.of()));
			return request;
		};
	}
}
