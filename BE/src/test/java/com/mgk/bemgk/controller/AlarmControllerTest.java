package com.mgk.bemgk.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.mgk.bemgk.dto.alarm.AlarmResponse;
import com.mgk.bemgk.dto.alarm.FeedingAlarmDto;
import com.mgk.bemgk.service.AlarmService;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class AlarmControllerTest {

	private MockMvc mockMvc;

	@Mock
	private AlarmService alarmService;

	@InjectMocks
	private AlarmController alarmController;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(alarmController).build();
	}

	@Test
	void getAlarms_returnsAlarmPayload() throws Exception {
		when(alarmService.getAlarms()).thenReturn(AlarmResponse.builder()
			.mostFrequentWalkHour(8)
			.feedingAlarms(List.of(FeedingAlarmDto.builder()
				.petId(1L)
				.petName("멩이")
				.feedTime(LocalTime.of(8, 0))
				.amountGram(100)
				.build()))
			.todayEvents(List.of())
			.build());

		mockMvc.perform(get("/api/alarm"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.mostFrequentWalkHour").value(8))
			.andExpect(jsonPath("$.feedingAlarms[0].petName").value("멩이"));
	}
}
