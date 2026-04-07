package com.mgk.bemgk.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mgk.bemgk.dto.auth.LoginRequest;
import com.mgk.bemgk.dto.auth.LoginResponse;
import com.mgk.bemgk.dto.auth.OtpRequest;
import com.mgk.bemgk.dto.auth.OtpRespponse;
import com.mgk.bemgk.dto.auth.RefreshRequest;
import com.mgk.bemgk.dto.auth.RefreshResponse;
import com.mgk.bemgk.dto.auth.SignupRequest;
import com.mgk.bemgk.dto.auth.SignupResponse;
import com.mgk.bemgk.service.AuthService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {
	private final AuthService authService;

	@PostMapping("/login")
	public LoginResponse login(@RequestBody LoginRequest request) {
		return authService.login(LoginRequest request);
	}

	@PostMapping("/signup")
	public SignupResponse signup(@RequestBody SignupRequest request) {
		return authService.signup(SignupRequest request);

	}

	@PostMapping("/send-otp")
	public OtpRespponse sendOtp(@RequestBody OtpRequest request) {
		return authService.getOtpToken(OtpRequest request);

	}

	@PostMapping("/refresh")
	public RefreshResponse refresh(@RequestBody RefreshRequest request) {
		return authService.refreshToken(RefreshRequest request);
	}

	@PostMapping("/logout")
	public void logout(@RequestBody String refreshToken) {
		authService.logout(refreshToken);
	}

	@PostMapping("/delete-account")
	public void deleteAccount(@RequestBody String email) {
		authService.deleteAccount(email);
	}
}
