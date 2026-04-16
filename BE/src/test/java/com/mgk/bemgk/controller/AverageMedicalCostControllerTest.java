package com.mgk.bemgk.controller;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.mgk.bemgk.service.AverageMedicalCostService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class AverageMedicalCostControllerTest {

	private MockMvc mockMvc;

	@InjectMocks
	private AverageMedicalCostController averageMedicalCostController;

	@Mock
	private AverageMedicalCostService averageMedicalCostService;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(averageMedicalCostController).build();
	}

	@Test
	@DisplayName("POST /api/dashboard/average-cost returns average cost text")
	void getAverageCost_returnsAnswerText() throws Exception {
		when(averageMedicalCostService.answerByItem(1L, "초진 진찰료"))
			.thenReturn("초진 진찰료 평균은 30,000원이에요.");

		mockMvc.perform(post("/api/dashboard/average-cost")
				.param("petId", "1")
				.param("item", "초진 진찰료"))
			.andExpect(status().isOk());

		verify(averageMedicalCostService).answerByItem(1L, "초진 진찰료");
	}
}
