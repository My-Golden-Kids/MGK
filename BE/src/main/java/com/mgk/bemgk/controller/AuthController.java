package com.mgk.bemgk.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mgk.bemgk.dto.auth.AuthResponse;
import com.mgk.bemgk.dto.auth.LoginRequest;
import com.mgk.bemgk.dto.auth.OtpRequest;
import com.mgk.bemgk.dto.auth.OtpResponse;
import com.mgk.bemgk.dto.auth.RefreshRequest;
import com.mgk.bemgk.dto.auth.RefreshResponse;
import com.mgk.bemgk.dto.auth.SignupRequest;
import com.mgk.bemgk.service.AuthService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {
	private final AuthService authService;

	@PostMapping("/login")
	public AuthResponse login(@RequestBody @Valid LoginRequest request) {
		return authService.login(request);
	}

	@PostMapping("/signup")
	public AuthResponse signup(@RequestBody @Valid SignupRequest request) {
		return authService.signup(request);

	}

	@PostMapping("/send-otp")
	public OtpResponse sendOtp(@RequestBody @Valid OtpRequest request) {
		return authService.getOtpToken(request);

	}

	@PostMapping("/refresh")
	public RefreshResponse refresh(@RequestBody @Valid RefreshRequest request) {
		return authService.refreshToken(request);
	}

	@PostMapping("/logout")
	public void logout(@RequestBody String refreshToken) {
		authService.logout(refreshToken);
	}

	@PostMapping("/delete-account")
	public void deleteAccount(@RequestBody String email) {
		authService.deleteAccount(email);
	}

	@PostMapping("/verify")
	public AuthResponse verify(@RequestBody String token) {
		return authService.verifyMagicLink(token);
	}

	@PostMapping("/reset-password")
	public void resetPassword(@RequestBody java.util.Map<String, String> body) {
		authService.resetPassword(body.get("token"), body.get("newPassword"));
	}
}
