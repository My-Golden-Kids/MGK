package com.mgk.bemgk.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.willDoNothing;
import static org.mockito.BDDMockito.willThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mgk.bemgk.dto.auth.ChangePasswordRequest;
import com.mgk.bemgk.dto.auth.DeleteAccountRequest;
import com.mgk.bemgk.service.AuthService;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class AuthControllerChangePasswordTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private AuthController authController;

    @Mock
    private AuthService authService;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    /**
     * RequestPostProcessor: 요청 처리 직전 같은 스레드에서 SecurityContextHolder 세팅.
     * standaloneSetup 은 JwtAuthenticationFilter 를 실행하지 않으므로 이 방식으로 주입.
     */
    private RequestPostProcessor withUserId(Long userId) {
        return (MockHttpServletRequest request) -> {
            SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(
                            userId, null, List.of(new SimpleGrantedAuthority("ROLE_USER"))));
            return request;
        };
    }

    // ── 인증 없이 호출 ──────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/change-password: 인증 없이 호출 시 401")
    void changePassword_noAuth_returns401() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest("Test1234!", "NewPass1!");

        mockMvc.perform(post("/api/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    // ── 정상 케이스 ────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/change-password: 성공 시 200")
    void changePassword_success_returns200() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest("Test1234!", "NewPass1!");

        willDoNothing().given(authService).changePassword(any(), any());

        mockMvc.perform(post("/api/auth/change-password")
                        .with(withUserId(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    // ── @Valid 검증 실패 ───────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/change-password: currentPassword 빈값 → 400")
    void changePassword_blankCurrentPassword_returns400() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest("", "NewPass1!");

        mockMvc.perform(post("/api/auth/change-password")
                        .with(withUserId(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/change-password: newPassword 빈값 → 400")
    void changePassword_blankNewPassword_returns400() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest("Test1234!", "");

        mockMvc.perform(post("/api/auth/change-password")
                        .with(withUserId(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/change-password: 요청 바디 없음 → 400")
    void changePassword_noBody_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/change-password")
                        .with(withUserId(1L))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    // ── 서비스 예외 처리 ───────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/change-password: 현재 비밀번호 불일치 → 401")
    void changePassword_wrongCurrentPassword_returns401() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest("WrongPass!", "NewPass1!");

        willThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "현재 비밀번호가 일치하지 않습니다."))
                .given(authService).changePassword(any(), any(ChangePasswordRequest.class));

        mockMvc.perform(post("/api/auth/change-password")
                        .with(withUserId(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    // ── DELETE ACCOUNT ─────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/delete-account: 인증 없이 호출 시 401")
    void deleteAccount_noAuth_returns401() throws Exception {
        DeleteAccountRequest request = new DeleteAccountRequest("Test1234!");

        mockMvc.perform(post("/api/auth/delete-account")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/auth/delete-account: 성공 시 200")
    void deleteAccount_success_returns200() throws Exception {
        DeleteAccountRequest request = new DeleteAccountRequest("Test1234!");

        willDoNothing().given(authService).deleteAccount(any(), any());

        mockMvc.perform(post("/api/auth/delete-account")
                        .with(withUserId(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/auth/delete-account: password 빈값 → 400")
    void deleteAccount_blankPassword_returns400() throws Exception {
        DeleteAccountRequest request = new DeleteAccountRequest("");

        mockMvc.perform(post("/api/auth/delete-account")
                        .with(withUserId(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/delete-account: 비밀번호 불일치 → 401")
    void deleteAccount_wrongPassword_returns401() throws Exception {
        DeleteAccountRequest request = new DeleteAccountRequest("WrongPass!");

        willThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "비밀번호가 올바르지 않습니다."))
                .given(authService).deleteAccount(any(), any(DeleteAccountRequest.class));

        mockMvc.perform(post("/api/auth/delete-account")
                        .with(withUserId(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }
}
