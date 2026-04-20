package com.mgk.bemgk.dto.auth;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class AuthDtosTest {

	@Test
	void authDtoBuildersAndConstructorsExposeValues() {
		AuthResponse authResponse = AuthResponse.builder()
			.accessToken("access")
			.refreshToken("refresh")
			.userId(1L)
			.email("test@test.com")
			.name("tester")
			.build();
		ChangePasswordRequest changePasswordRequest = new ChangePasswordRequest("old", "new");
		DeleteAccountRequest deleteAccountRequest = new DeleteAccountRequest("pw");
		LoginRequest loginRequest = LoginRequest.builder().email("a@test.com").password("pw").build();
		OtpRequest otpRequest = OtpRequest.builder().email("a@test.com").password("pw").build();
		OtpResponse otpResponse = OtpResponse.builder().token("otp").build();
		RefreshRequest refreshRequest = RefreshRequest.builder().refreshToken("refresh").build();
		RefreshResponse refreshResponse = RefreshResponse.builder().accessToken("new-access").refreshToken("new-refresh").build();
		SignupRequest signupRequest = SignupRequest.builder()
			.email("sign@test.com")
			.password("pw")
			.accountNum("1234")
			.build();
		SignupResponse signupResponse = SignupResponse.builder().userId(2L).email("sign@test.com").name("signup").build();

		assertThat(authResponse.getAccessToken()).isEqualTo("access");
		assertThat(authResponse.getRefreshToken()).isEqualTo("refresh");
		assertThat(authResponse.getUserId()).isEqualTo(1L);
		assertThat(authResponse.getEmail()).isEqualTo("test@test.com");
		assertThat(authResponse.getName()).isEqualTo("tester");
		assertThat(changePasswordRequest.getCurrentPassword()).isEqualTo("old");
		assertThat(changePasswordRequest.getNewPassword()).isEqualTo("new");
		assertThat(deleteAccountRequest.getPassword()).isEqualTo("pw");
		assertThat(loginRequest.getEmail()).isEqualTo("a@test.com");
		assertThat(loginRequest.getPassword()).isEqualTo("pw");
		assertThat(otpRequest.getEmail()).isEqualTo("a@test.com");
		assertThat(otpRequest.getPassword()).isEqualTo("pw");
		assertThat(otpResponse.getToken()).isEqualTo("otp");
		assertThat(refreshRequest.getRefreshToken()).isEqualTo("refresh");
		assertThat(refreshResponse.getAccessToken()).isEqualTo("new-access");
		assertThat(refreshResponse.getRefreshToken()).isEqualTo("new-refresh");
		assertThat(signupRequest.getEmail()).isEqualTo("sign@test.com");
		assertThat(signupRequest.getPassword()).isEqualTo("pw");
		assertThat(signupRequest.getAccountNum()).isEqualTo("1234");
		assertThat(signupResponse.getUserId()).isEqualTo(2L);
		assertThat(signupResponse.getEmail()).isEqualTo("sign@test.com");
		assertThat(signupResponse.getName()).isEqualTo("signup");
	}
}
