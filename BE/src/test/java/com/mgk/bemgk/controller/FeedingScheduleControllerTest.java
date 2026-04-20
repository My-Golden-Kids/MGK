package com.mgk.bemgk.controller;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mgk.bemgk.dto.feeding.FeedingScheduleResponse;
import com.mgk.bemgk.service.FeedingScheduleService;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class FeedingScheduleControllerTest {

	private final ObjectMapper objectMapper = new ObjectMapper();
	private MockMvc mockMvc;

	@Mock
	private FeedingScheduleService feedingScheduleService;

	@InjectMocks
	private FeedingScheduleController feedingScheduleController;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(feedingScheduleController).build();
	}

	@Test
	void getSchedules_returnsSchedules() throws Exception {
		when(feedingScheduleService.getSchedules()).thenReturn(List.of(scheduleResponse()));
		when(feedingScheduleService.getSchedule(1L)).thenReturn(scheduleResponse());

		mockMvc.perform(get("/api/feeding-schedules"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].petName").value("멩이"));

		mockMvc.perform(get("/api/feeding-schedules/1"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.petId").value(1));
	}

	@Test
	void createSchedule_returnsCreated() throws Exception {
		when(feedingScheduleService.createSchedule(org.mockito.ArgumentMatchers.eq(1L), org.mockito.ArgumentMatchers.any()))
			.thenReturn(scheduleResponse());

		mockMvc.perform(post("/api/feeding-schedules/1")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"firstFeedTime":"08:00:00","mealsPerDay":3,"customAmountG":90}
					"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.petId").value(1));
	}

	@Test
	void createSchedule_rejectsInvalidMealsPerDay() throws Exception {
		mockMvc.perform(post("/api/feeding-schedules/1")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"firstFeedTime":"08:00:00","mealsPerDay":1}
					"""))
			.andExpect(status().isBadRequest());
	}

	@Test
	void updateAndDeleteSchedule_delegateToService() throws Exception {
		when(feedingScheduleService.updateSchedule(org.mockito.ArgumentMatchers.eq(1L), org.mockito.ArgumentMatchers.any()))
			.thenReturn(scheduleResponse());

		mockMvc.perform(put("/api/feeding-schedules/1")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"firstFeedTime":"09:00:00","mealsPerDay":2}
					"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.mealsPerDay").value(3));

		mockMvc.perform(delete("/api/feeding-schedules/1"))
			.andExpect(status().isNoContent());

		verify(feedingScheduleService).deleteSchedule(1L);
	}

	private FeedingScheduleResponse scheduleResponse() {
		return FeedingScheduleResponse.builder()
			.petId(1L)
			.petName("멩이")
			.firstFeedTime(LocalTime.of(8, 0))
			.mealsPerDay(3)
			.customAmountG(90)
			.perMealAmountG(30)
			.feedTimes(List.of(LocalTime.of(8, 0)))
			.build();
	}
}
