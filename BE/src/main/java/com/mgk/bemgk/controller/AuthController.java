package com.mgk.bemgk.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.mgk.bemgk.dto.auth.AuthResponse;
import com.mgk.bemgk.dto.auth.ChangePasswordRequest;
import com.mgk.bemgk.dto.auth.DeleteAccountRequest;
import com.mgk.bemgk.dto.auth.LoginRequest;
import com.mgk.bemgk.dto.auth.OtpRequest;
import com.mgk.bemgk.dto.auth.OtpResponse;
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
	public AuthResponse login(@RequestBody @Valid LoginRequest request) {
		return authService.login(request);
	}

	@PostMapping("/signup")
	public SignupResponse signup(@RequestBody @Valid SignupRequest request) {
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

	@PostMapping("/delete-account")
	public void deleteAccount(@RequestBody @Valid DeleteAccountRequest request) {
		Long userId = resolveUserId();
		authService.deleteAccount(userId, request);
	}

	@PostMapping("/verify")
	public AuthResponse verify(@RequestBody String token) {
		return authService.verifyMagicLink(token);
	}

	@PostMapping("/reset-password")
	public void resetPassword(@RequestBody java.util.Map<String, String> body) {
		authService.resetPassword(body.get("token"), body.get("newPassword"));
	}

	@PostMapping("/change-password")
	public void changePassword(@RequestBody @Valid ChangePasswordRequest request) {
		Long userId = resolveUserId();
		authService.changePassword(userId, request);
	}

	@PostMapping("/logout")
	public void logout(@RequestBody @Valid RefreshRequest request) {
		authService.logout(request.getRefreshToken());
	}

	private Long resolveUserId() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null || !(authentication.getPrincipal() instanceof Long userId)) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
		}
		return userId;
	}
}
