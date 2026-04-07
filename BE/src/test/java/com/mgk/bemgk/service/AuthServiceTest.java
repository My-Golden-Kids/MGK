package com.mgk.bemgk.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.never;

import com.mgk.bemgk.auth.JwtProvider;
import com.mgk.bemgk.dto.auth.AuthResponse;
import com.mgk.bemgk.dto.auth.LoginRequest;
import com.mgk.bemgk.dto.auth.OtpRequest;
import com.mgk.bemgk.dto.auth.OtpResponse;
import com.mgk.bemgk.dto.auth.RefreshRequest;
import com.mgk.bemgk.dto.auth.RefreshResponse;
import com.mgk.bemgk.dto.auth.SignupRequest;
import com.mgk.bemgk.entity.User;
import com.mgk.bemgk.repository.AccountRepository;
import com.mgk.bemgk.repository.UserRepository;
import com.mgk.bemgk.repository.VerificationRepository;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @InjectMocks
    private AuthService authService;

    @Mock
    private UserRepository userRepository;
    @Mock
    private AccountRepository accountRepository;
    @Mock
    private VerificationRepository verificationRepository;
    @Mock
    private JwtProvider jwtProvider;
    @Mock
    private BCryptPasswordEncoder passwordEncoder;

    private User mockUser(Long id, String email) {
        User user = User.builder()
                .name("김돌멩")
                .email(email)
                .password("encodedPassword")
                .build();
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    // ── signup ─────────────────────────────────────────────────

    @Test
    @DisplayName("signup: 성공")
    void signup_success() {
        SignupRequest request = SignupRequest.builder()
                .email("new@test.com")
                .password("Test1234!")
                .accountNum("123-456-789")
                .build();
        User saved = mockUser(1L, "new@test.com");

        given(userRepository.existsByEmail("new@test.com")).willReturn(false);
        given(passwordEncoder.encode("Test1234!")).willReturn("encodedPassword");
        given(userRepository.save(any(User.class))).willReturn(saved);
        given(jwtProvider.generateAccessToken(1L, "new@test.com")).willReturn("access");
        given(jwtProvider.generateRefreshToken(1L)).willReturn("refresh");

        AuthResponse response = authService.signup(request);

        assertThat(response.getAccessToken()).isEqualTo("access");
        assertThat(response.getRefreshToken()).isEqualTo("refresh");
        assertThat(response.getEmail()).isEqualTo("new@test.com");
        then(accountRepository).should().save(any());
    }

    @Test
    @DisplayName("signup: 이메일 중복 시 예외")
    void signup_duplicateEmail_throws() {
        SignupRequest request = SignupRequest.builder()
                .email("dup@test.com")
                .password("Test1234!")
                .accountNum("123-456-789")
                .build();

        given(userRepository.existsByEmail("dup@test.com")).willReturn(true);

        assertThatThrownBy(() -> authService.signup(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("이미 사용 중인 이메일");
        then(userRepository).should(never()).save(any());
    }

    // ── login ──────────────────────────────────────────────────

    @Test
    @DisplayName("login: 성공")
    void login_success() {
        LoginRequest request = LoginRequest.builder()
                .email("test@test.com")
                .password("Test1234!")
                .build();
        User user = mockUser(1L, "test@test.com");

        given(userRepository.findByEmail("test@test.com")).willReturn(Optional.of(user));
        given(passwordEncoder.matches("Test1234!", "encodedPassword")).willReturn(true);
        given(jwtProvider.generateAccessToken(1L, "test@test.com")).willReturn("access");
        given(jwtProvider.generateRefreshToken(1L)).willReturn("refresh");

        AuthResponse response = authService.login(request);

        assertThat(response.getAccessToken()).isEqualTo("access");
        assertThat(response.getEmail()).isEqualTo("test@test.com");
    }

    @Test
    @DisplayName("login: 존재하지 않는 이메일 시 예외")
    void login_emailNotFound_throws() {
        LoginRequest request = LoginRequest.builder()
                .email("none@test.com")
                .password("Test1234!")
                .build();

        given(userRepository.findByEmail("none@test.com")).willReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("이메일 또는 비밀번호");
    }

    @Test
    @DisplayName("login: 비밀번호 불일치 시 예외")
    void login_wrongPassword_throws() {
        LoginRequest request = LoginRequest.builder()
                .email("test@test.com")
                .password("WrongPass!")
                .build();
        User user = mockUser(1L, "test@test.com");

        given(userRepository.findByEmail("test@test.com")).willReturn(Optional.of(user));
        given(passwordEncoder.matches("WrongPass!", "encodedPassword")).willReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("이메일 또는 비밀번호");
    }

    // ── getOtpToken ────────────────────────────────────────────

    @Test
    @DisplayName("getOtpToken: 성공")
    void getOtpToken_success() {
        OtpRequest request = OtpRequest.builder()
                .email("test@test.com")
                .build();
        User user = mockUser(1L, "test@test.com");

        given(userRepository.findByEmail("test@test.com")).willReturn(Optional.of(user));

        OtpResponse response = authService.getOtpToken(request);

        assertThat(response.getToken()).isNotBlank();
        then(verificationRepository).should().save(any());
    }

    @Test
    @DisplayName("getOtpToken: 존재하지 않는 이메일 시 예외")
    void getOtpToken_emailNotFound_throws() {
        OtpRequest request = OtpRequest.builder()
                .email("none@test.com")
                .build();

        given(userRepository.findByEmail("none@test.com")).willReturn(Optional.empty());

        assertThatThrownBy(() -> authService.getOtpToken(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("존재하지 않는 이메일");
    }

    // ── refreshToken ───────────────────────────────────────────

    @Test
    @DisplayName("refreshToken: 성공")
    void refreshToken_success() {
        RefreshRequest request = RefreshRequest.builder()
                .refreshToken("valid-refresh-token")
                .build();
        User user = mockUser(1L, "test@test.com");

        given(jwtProvider.validateToken("valid-refresh-token")).willReturn(true);
        given(jwtProvider.getUserId("valid-refresh-token")).willReturn(1L);
        given(userRepository.findById(1L)).willReturn(Optional.of(user));
        given(jwtProvider.generateAccessToken(1L, "test@test.com")).willReturn("new-access");

        RefreshResponse response = authService.refreshToken(request);

        assertThat(response.getAccessToken()).isEqualTo("new-access");
    }

    @Test
    @DisplayName("refreshToken: 유효하지 않은 토큰 시 예외")
    void refreshToken_invalidToken_throws() {
        RefreshRequest request = RefreshRequest.builder()
                .refreshToken("invalid-token")
                .build();

        given(jwtProvider.validateToken("invalid-token")).willReturn(false);

        assertThatThrownBy(() -> authService.refreshToken(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("유효하지 않은 리프레시 토큰");
    }

    // ── deleteAccount ──────────────────────────────────────────

    @Test
    @DisplayName("deleteAccount: 성공")
    void deleteAccount_success() {
        User user = mockUser(1L, "test@test.com");

        given(userRepository.findByEmail("test@test.com")).willReturn(Optional.of(user));

        authService.deleteAccount("test@test.com");

        then(userRepository).should().softDeleteByEmail(anyString(), any());
    }

    @Test
    @DisplayName("deleteAccount: 존재하지 않는 이메일 시 예외")
    void deleteAccount_emailNotFound_throws() {
        given(userRepository.findByEmail("none@test.com")).willReturn(Optional.empty());

        assertThatThrownBy(() -> authService.deleteAccount("none@test.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("존재하지 않는 이메일");
    }
}
