package com.mgk.bemgk.service;

import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PostMapping;

import com.mgk.bemgk.controller.AuthController;
<<<<<<< HEAD
import com.mgk.bemgk.dto.auth.LoginRequest;
=======
>>>>>>> d751e8bbe18062f57b5504986b40bb7a31e485b7
import com.mgk.bemgk.dto.auth.OtpRequest;
import com.mgk.bemgk.dto.auth.RefreshRequest;
import com.mgk.bemgk.dto.auth.SignupRequest;
import com.mgk.bemgk.repository.AccountRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {
	private final AccountRepository accountRepository;

	public void login(LoginRequest request) {
	}
	public void signup(SignupRequest request) {}

	public void getOtpToken(OtpRequest request) {}

	public void refreshToken(RefreshRequest request) {}

	public void logout(String refreshToken) {}

	public void deleteAccount(String email) {}
}
