package com.mgk.bemgk.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class JwtProviderTest {

    private JwtProvider jwtProvider;

    // Base64("testSecretKeyForJWTTestingPurposesOnly") — 38bytes, HS256 최소 32bytes 충족
    private static final String TEST_SECRET = "dGVzdFNlY3JldEtleUZvckpXVFRlc3RpbmdQdXJwb3Nlc09ubHk=";
    private static final long ACCESS_EXPIRATION = 3600000L;   // 1h
    private static final long REFRESH_EXPIRATION = 604800000L; // 7d

    @BeforeEach
    void setUp() {
        jwtProvider = new JwtProvider();
        ReflectionTestUtils.setField(jwtProvider, "secretKey", TEST_SECRET);
        ReflectionTestUtils.setField(jwtProvider, "accessExpiration", ACCESS_EXPIRATION);
        ReflectionTestUtils.setField(jwtProvider, "refreshExpiration", REFRESH_EXPIRATION);
    }

    @Test
    @DisplayName("accessToken 생성 후 validateToken 성공")
    void generateAccessToken_validate_success() {
        String token = jwtProvider.generateAccessToken(1L, "test@test.com");

        assertThat(jwtProvider.validateToken(token)).isTrue();
    }

    @Test
    @DisplayName("refreshToken 생성 후 validateToken 성공")
    void generateRefreshToken_validate_success() {
        String token = jwtProvider.generateRefreshToken(1L);

        assertThat(jwtProvider.validateToken(token)).isTrue();
    }

    @Test
    @DisplayName("accessToken에서 userId 파싱")
    void getUserId_from_accessToken() {
        String token = jwtProvider.generateAccessToken(42L, "test@test.com");

        assertThat(jwtProvider.getUserId(token)).isEqualTo(42L);
    }

    @Test
    @DisplayName("accessToken에서 email 파싱")
    void getEmail_from_accessToken() {
        String token = jwtProvider.generateAccessToken(1L, "test@test.com");

        assertThat(jwtProvider.getEmail(token)).isEqualTo("test@test.com");
    }

    @Test
    @DisplayName("잘못된 토큰은 validateToken false 반환")
    void validateToken_invalid_returns_false() {
        assertThat(jwtProvider.validateToken("invalid.token.value")).isFalse();
    }

    @Test
    @DisplayName("빈 문자열 토큰은 validateToken false 반환")
    void validateToken_empty_returns_false() {
        assertThat(jwtProvider.validateToken("")).isFalse();
    }

    @Test
    @DisplayName("refreshToken에서 만료시각 파싱 - 현재보다 미래여야 함")
    void getExpiration_from_refreshToken() {
        String token = jwtProvider.generateRefreshToken(1L);
        LocalDateTime expiration = jwtProvider.getExpiration(token);
        assertThat(expiration).isAfter(LocalDateTime.now());
    }

    @Test
    @DisplayName("accessToken에서 만료시각 파싱 - 현재보다 미래여야 함")
    void getExpiration_from_accessToken() {
        String token = jwtProvider.generateAccessToken(1L, "test@test.com");
        LocalDateTime expiration = jwtProvider.getExpiration(token);
        assertThat(expiration).isAfter(LocalDateTime.now());
    }
}
