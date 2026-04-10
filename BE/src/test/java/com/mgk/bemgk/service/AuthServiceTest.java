package com.mgk.bemgk.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.*;

import com.mgk.bemgk.auth.JwtProvider;
import com.mgk.bemgk.dto.auth.AuthResponse;
import com.mgk.bemgk.dto.auth.ChangePasswordRequest;
import com.mgk.bemgk.dto.auth.DeleteAccountRequest;
import com.mgk.bemgk.dto.auth.LoginRequest;
import com.mgk.bemgk.dto.auth.OtpRequest;
import com.mgk.bemgk.dto.auth.OtpResponse;
import com.mgk.bemgk.dto.auth.RefreshRequest;
import com.mgk.bemgk.dto.auth.RefreshResponse;
import com.mgk.bemgk.dto.auth.SignupRequest;
import com.mgk.bemgk.entity.AccountBook;
import com.mgk.bemgk.entity.RefreshToken;
import com.mgk.bemgk.entity.User;
import com.mgk.bemgk.entity.Verification;
import com.mgk.bemgk.repository.AccountBookRepository;
import com.mgk.bemgk.repository.AccountRepository;
import com.mgk.bemgk.repository.RefreshTokenRepository;
import com.mgk.bemgk.repository.UserRepository;
import com.mgk.bemgk.repository.VerificationRepository;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @InjectMocks
    private AuthService authService;

    @Mock
    private UserRepository userRepository;
    @Mock
    private AccountRepository accountRepository;
    @Mock
    private AccountBookRepository accountBookRepository;
    @Mock
    private VerificationRepository verificationRepository;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;
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
        given(accountBookRepository.save(any())).willReturn(mock(AccountBook.class));

        AuthResponse response = authService.signup(request);

        assertThat(response.getAccessToken()).isEqualTo("access");
        assertThat(response.getRefreshToken()).isEqualTo("refresh");
        assertThat(response.getEmail()).isEqualTo("new@test.com");
        then(accountRepository).should().save(any());
        then(accountBookRepository).should().save(any());
        then(refreshTokenRepository).should().save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("signup: 이메일 중복 시 409")
    void signup_duplicateEmail_throws() {
        SignupRequest request = SignupRequest.builder()
                .email("dup@test.com")
                .password("Test1234!")
                .accountNum("123-456-789")
                .build();

        given(userRepository.existsByEmail("dup@test.com")).willReturn(true);

        assertThatThrownBy(() -> authService.signup(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.CONFLICT));
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
        then(refreshTokenRepository).should().save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("login: 존재하지 않는 이메일 시 401")
    void login_emailNotFound_throws() {
        LoginRequest request = LoginRequest.builder()
                .email("none@test.com")
                .password("Test1234!")
                .build();

        given(userRepository.findByEmail("none@test.com")).willReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    @DisplayName("login: 탈퇴된 계정 시 401")
    void login_deletedAccount_throws() {
        LoginRequest request = LoginRequest.builder()
                .email("test@test.com")
                .password("Test1234!")
                .build();
        User user = mockUser(1L, "test@test.com");
        ReflectionTestUtils.setField(user, "deletedAt", java.time.LocalDateTime.now());

        given(userRepository.findByEmail("test@test.com")).willReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    @DisplayName("login: 비밀번호 불일치 시 401")
    void login_wrongPassword_throws() {
        LoginRequest request = LoginRequest.builder()
                .email("test@test.com")
                .password("WrongPass!")
                .build();
        User user = mockUser(1L, "test@test.com");

        given(userRepository.findByEmail("test@test.com")).willReturn(Optional.of(user));
        given(passwordEncoder.matches("WrongPass!", "encodedPassword")).willReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.UNAUTHORIZED));
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
    @DisplayName("getOtpToken: 존재하지 않는 이메일 시 404")
    void getOtpToken_emailNotFound_throws() {
        OtpRequest request = OtpRequest.builder()
                .email("none@test.com")
                .build();

        given(userRepository.findByEmail("none@test.com")).willReturn(Optional.empty());

        assertThatThrownBy(() -> authService.getOtpToken(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.NOT_FOUND));
    }

    // ── refreshToken ───────────────────────────────────────────

    @Test
    @DisplayName("refreshToken: 성공 - DB 검증 및 토큰 rotation")
    void refreshToken_success() {
        User user = mockUser(1L, "test@test.com");
        RefreshToken stored = mock(RefreshToken.class);
        given(stored.isExpired()).willReturn(false);
        given(stored.getUser()).willReturn(user);

        RefreshRequest request = RefreshRequest.builder()
                .refreshToken("valid-refresh-token")
                .build();

        given(jwtProvider.validateToken("valid-refresh-token")).willReturn(true);
        given(refreshTokenRepository.findByToken("valid-refresh-token")).willReturn(Optional.of(stored));
        given(jwtProvider.generateRefreshToken(1L)).willReturn("new-refresh");
        given(jwtProvider.generateAccessToken(1L, "test@test.com")).willReturn("new-access");

        RefreshResponse response = authService.refreshToken(request);

        assertThat(response.getAccessToken()).isEqualTo("new-access");
        assertThat(response.getRefreshToken()).isEqualTo("new-refresh");
        then(refreshTokenRepository).should().delete(stored);
        then(refreshTokenRepository).should().save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("refreshToken: JWT 서명 유효하지 않은 토큰 시 401")
    void refreshToken_invalidJwt_throws() {
        RefreshRequest request = RefreshRequest.builder()
                .refreshToken("invalid-token")
                .build();

        given(jwtProvider.validateToken("invalid-token")).willReturn(false);

        assertThatThrownBy(() -> authService.refreshToken(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.UNAUTHORIZED));
        then(refreshTokenRepository).should(never()).findByToken(any());
    }

    @Test
    @DisplayName("refreshToken: DB에 존재하지 않는 토큰 시 401")
    void refreshToken_notFoundInDb_throws() {
        RefreshRequest request = RefreshRequest.builder()
                .refreshToken("valid-but-missing-token")
                .build();

        given(jwtProvider.validateToken("valid-but-missing-token")).willReturn(true);
        given(refreshTokenRepository.findByToken("valid-but-missing-token")).willReturn(Optional.empty());

        assertThatThrownBy(() -> authService.refreshToken(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    @DisplayName("refreshToken: DB에서 만료된 토큰 시 401 및 토큰 삭제")
    void refreshToken_expiredInDb_throws() {
        RefreshToken stored = mock(RefreshToken.class);
        given(stored.isExpired()).willReturn(true);

        RefreshRequest request = RefreshRequest.builder()
                .refreshToken("expired-token")
                .build();

        given(jwtProvider.validateToken("expired-token")).willReturn(true);
        given(refreshTokenRepository.findByToken("expired-token")).willReturn(Optional.of(stored));

        assertThatThrownBy(() -> authService.refreshToken(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.UNAUTHORIZED));
        then(refreshTokenRepository).should().delete(stored);
    }

    // ── logout ─────────────────────────────────────────────────

    @Test
    @DisplayName("logout: 유효한 토큰이면 삭제")
    void logout_validToken_deletesToken() {
        RefreshToken stored = mock(RefreshToken.class);
        given(refreshTokenRepository.findByToken("some-token")).willReturn(Optional.of(stored));

        authService.logout("some-token");

        then(refreshTokenRepository).should().delete(stored);
    }

    @Test
    @DisplayName("logout: 존재하지 않는 토큰이면 아무것도 하지 않음")
    void logout_missingToken_doesNothing() {
        given(refreshTokenRepository.findByToken("ghost-token")).willReturn(Optional.empty());

        authService.logout("ghost-token");

        then(refreshTokenRepository).should(never()).delete(any());
    }

    // ── deleteAccount ──────────────────────────────────────────

    @Test
    @DisplayName("deleteAccount: 성공 - refresh token 전체 revoke 후 탈퇴")
    void deleteAccount_success() {
        User user = mockUser(1L, "test@test.com");
        DeleteAccountRequest request = new DeleteAccountRequest("Test1234!");

        given(userRepository.findById(1L)).willReturn(Optional.of(user));
        given(passwordEncoder.matches("Test1234!", "encodedPassword")).willReturn(true);

        authService.deleteAccount(1L, request);

        then(refreshTokenRepository).should().deleteAllByUser(user);
        then(userRepository).should().softDeleteByEmail(anyString(), any());
    }

    @Test
    @DisplayName("deleteAccount: 존재하지 않는 userId 시 401")
    void deleteAccount_userNotFound_throws401() {
        DeleteAccountRequest request = new DeleteAccountRequest("Test1234!");

        given(userRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> authService.deleteAccount(99L, request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    @DisplayName("deleteAccount: 비밀번호 불일치 시 401")
    void deleteAccount_wrongPassword_throws401() {
        User user = mockUser(1L, "test@test.com");
        DeleteAccountRequest request = new DeleteAccountRequest("WrongPass!");

        given(userRepository.findById(1L)).willReturn(Optional.of(user));
        given(passwordEncoder.matches("WrongPass!", "encodedPassword")).willReturn(false);

        assertThatThrownBy(() -> authService.deleteAccount(1L, request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.UNAUTHORIZED);
                    assertThat(ex.getMessage()).contains("비밀번호가 올바르지 않습니다");
                });
        then(userRepository).should(never()).softDeleteByEmail(any(), any());
    }

    // ── verifyMagicLink ────────────────────────────────────────

    @Test
    @DisplayName("verifyMagicLink: 성공")
    void verifyMagicLink_success() {
        User user = mockUser(1L, "test@test.com");
        Verification verification = Verification.builder()
                .user(user)
                .identifier("test@test.com")
                .token("valid-token")
                .expiresAt(java.time.LocalDateTime.now().plusMinutes(10))
                .build();

        given(verificationRepository.findByToken("valid-token")).willReturn(Optional.of(verification));
        given(jwtProvider.generateAccessToken(1L, "test@test.com")).willReturn("access");
        given(jwtProvider.generateRefreshToken(1L)).willReturn("refresh");

        AuthResponse response = authService.verifyMagicLink("valid-token");

        assertThat(response.getEmail()).isEqualTo("test@test.com");
        then(verificationRepository).should().deleteByToken("valid-token");
        then(refreshTokenRepository).should().save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("verifyMagicLink: 존재하지 않는 토큰 시 400")
    void verifyMagicLink_invalidToken_throws() {
        given(verificationRepository.findByToken("bad-token")).willReturn(Optional.empty());

        assertThatThrownBy(() -> authService.verifyMagicLink("bad-token"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    @DisplayName("verifyMagicLink: 만료된 토큰 시 410")
    void verifyMagicLink_expiredToken_throws() {
        User user = mockUser(1L, "test@test.com");
        Verification verification = Verification.builder()
                .user(user)
                .identifier("test@test.com")
                .token("expired-token")
                .expiresAt(java.time.LocalDateTime.now().minusMinutes(1))
                .build();

        given(verificationRepository.findByToken("expired-token")).willReturn(Optional.of(verification));

        assertThatThrownBy(() -> authService.verifyMagicLink("expired-token"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.GONE));
    }

    // ── resetPassword ──────────────────────────────────────────

    @Test
    @DisplayName("resetPassword: 성공")
    void resetPassword_success() {
        User user = mockUser(1L, "test@test.com");
        Verification verification = Verification.builder()
                .user(user)
                .identifier("test@test.com")
                .token("valid-token")
                .expiresAt(java.time.LocalDateTime.now().plusMinutes(10))
                .build();

        given(verificationRepository.findByToken("valid-token")).willReturn(Optional.of(verification));
        given(passwordEncoder.encode("NewPass1!")).willReturn("encodedNew");

        authService.resetPassword("valid-token", "NewPass1!");

        then(userRepository).should().updatePassword(1L, "encodedNew");
        then(verificationRepository).should().deleteByToken("valid-token");
    }

    @Test
    @DisplayName("resetPassword: 존재하지 않는 토큰 시 400")
    void resetPassword_invalidToken_throws() {
        given(verificationRepository.findByToken("bad-token")).willReturn(Optional.empty());

        assertThatThrownBy(() -> authService.resetPassword("bad-token", "NewPass1!"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    @DisplayName("resetPassword: 만료된 토큰 시 410")
    void resetPassword_expiredToken_throws() {
        User user = mockUser(1L, "test@test.com");
        Verification verification = Verification.builder()
                .user(user)
                .identifier("test@test.com")
                .token("expired-token")
                .expiresAt(java.time.LocalDateTime.now().minusMinutes(1))
                .build();

        given(verificationRepository.findByToken("expired-token")).willReturn(Optional.of(verification));

        assertThatThrownBy(() -> authService.resetPassword("expired-token", "NewPass1!"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.GONE));
    }

    // ── changePassword ─────────────────────────────────────────

    @Test
    @DisplayName("changePassword: 성공")
    void changePassword_success() {
        User user = mockUser(1L, "test@test.com");
        ChangePasswordRequest request = new ChangePasswordRequest("Test1234!", "NewPass1!");

        given(userRepository.findById(1L)).willReturn(Optional.of(user));
        given(passwordEncoder.matches("Test1234!", "encodedPassword")).willReturn(true);
        given(passwordEncoder.encode("NewPass1!")).willReturn("encodedNew");

        authService.changePassword(1L, request);

        then(userRepository).should().updatePassword(1L, "encodedNew");
    }

    @Test
    @DisplayName("changePassword: 존재하지 않는 userId 시 401")
    void changePassword_userNotFound_throws401() {
        ChangePasswordRequest request = new ChangePasswordRequest("Test1234!", "NewPass1!");

        given(userRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> authService.changePassword(99L, request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.UNAUTHORIZED);
                });
    }

    @Test
    @DisplayName("changePassword: 현재 비밀번호 불일치 시 401")
    void changePassword_wrongCurrentPassword_throws401() {
        User user = mockUser(1L, "test@test.com");
        ChangePasswordRequest request = new ChangePasswordRequest("WrongPass!", "NewPass1!");

        given(userRepository.findById(1L)).willReturn(Optional.of(user));
        given(passwordEncoder.matches("WrongPass!", "encodedPassword")).willReturn(false);

        assertThatThrownBy(() -> authService.changePassword(1L, request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.UNAUTHORIZED);
                    assertThat(ex.getMessage()).contains("현재 비밀번호가 일치하지 않습니다");
                });
        then(userRepository).should(never()).updatePassword(any(), any());
    }
}
