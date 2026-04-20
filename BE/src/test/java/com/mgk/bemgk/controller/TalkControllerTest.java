package com.mgk.bemgk.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mgk.bemgk.dto.talk.TalkRequest;
import com.mgk.bemgk.dto.talk.TalkResponse;
import com.mgk.bemgk.service.TalkService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class TalkControllerTest {

	private final ObjectMapper objectMapper = new ObjectMapper();
	private MockMvc mockMvc;

	@InjectMocks
	private TalkController talkController;

	@Mock
	private TalkService talkService;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(talkController).build();
	}

	@Test
	@DisplayName("POST /api/talk returns talk response payload")
	void talk_returnsTalkResponse() throws Exception {
		TalkRequest request = new TalkRequest("앞으로 병원비 얼마나 들까?", 3L);
		when(talkService.ask("앞으로 병원비 얼마나 들까?", 3L))
			.thenReturn(new TalkResponse("월 평균 6만원~9만원 예상됩니다."));

		mockMvc.perform(post("/api/talk")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(request)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.message").value("월 평균 6만원~9만원 예상됩니다."));
	}

	@Test
	@DisplayName("POST /api/talk rejects blank transcript")
	void talk_rejectsBlankTranscript() throws Exception {
		TalkRequest request = new TalkRequest("", 3L);

		mockMvc.perform(post("/api/talk")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(request)))
			.andExpect(status().isBadRequest());
	}
}
