package com.mgk.bemgk.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mgk.bemgk.dto.auth.AuthResponse;
import com.mgk.bemgk.dto.auth.OtpResponse;
import com.mgk.bemgk.dto.auth.RefreshResponse;
import com.mgk.bemgk.dto.auth.SignupResponse;
import com.mgk.bemgk.service.AuthService;
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
class AuthControllerBasicEndpointsTest {

	private final ObjectMapper objectMapper = new ObjectMapper();
	private MockMvc mockMvc;

	@Mock
	private AuthService authService;

	@InjectMocks
	private AuthController authController;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
	}

	@Test
	void loginSignupOtpRefreshVerifyResetLogout_work() throws Exception {
		when(authService.login(any())).thenReturn(AuthResponse.builder().accessToken("a").refreshToken("r").userId(1L).build());
		when(authService.signup(any())).thenReturn(SignupResponse.builder().userId(1L).email("a@a.com").name("유저").build());
		when(authService.getOtpToken(any())).thenReturn(OtpResponse.builder().token("otp").build());
		when(authService.refreshToken(any())).thenReturn(RefreshResponse.builder().accessToken("newA").refreshToken("newR").build());
		when(authService.verifyMagicLink(anyString())).thenReturn(AuthResponse.builder().accessToken("a").refreshToken("r").userId(1L).build());

		mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"a@a.com\",\"password\":\"pw\"}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.accessToken").value("a"));

		mockMvc.perform(post("/api/auth/signup")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"a@a.com\",\"password\":\"pw\",\"accountNum\":\"123\"}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.userId").value(1));

		mockMvc.perform(post("/api/auth/send-otp")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"a@a.com\",\"password\":\"pw\"}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.token").value("otp"));

		mockMvc.perform(post("/api/auth/refresh")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"refreshToken\":\"refresh\"}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.accessToken").value("newA"));

		mockMvc.perform(post("/api/auth/verify")
				.contentType(MediaType.APPLICATION_JSON)
				.content("\"magic\""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.userId").value(1));

		mockMvc.perform(post("/api/auth/reset-password")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"token\":\"t\",\"newPassword\":\"new\"}"))
			.andExpect(status().isOk());
		verify(authService).resetPassword("t", "new");

		mockMvc.perform(post("/api/auth/logout")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"refreshToken\":\"refresh\"}"))
			.andExpect(status().isOk());
		verify(authService).logout("refresh");
	}
}
