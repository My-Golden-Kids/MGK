package com.mgk.bemgk.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
import com.mgk.bemgk.dto.auth.SignupResponse;
import com.mgk.bemgk.entity.Account;
import com.mgk.bemgk.entity.AccountBook;
import com.mgk.bemgk.entity.AccountBookCategory;
import com.mgk.bemgk.entity.RefreshToken;
import com.mgk.bemgk.entity.User;
import com.mgk.bemgk.entity.Verification;
import com.mgk.bemgk.repository.AccountBookRepository;
import com.mgk.bemgk.repository.AccountRepository;
import com.mgk.bemgk.repository.RefreshTokenRepository;
import com.mgk.bemgk.repository.UserRepository;
import com.mgk.bemgk.repository.VerificationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {
	private static final String DEFAULT_NAME = "김돌멩";
	private static final String DEFAULT_BANK_NAME = "HanaBank";

	private final UserRepository userRepository;
	private final AccountRepository accountRepository;
	private final VerificationRepository verificationRepository;
	private final RefreshTokenRepository refreshTokenRepository;
	private final JwtProvider jwtProvider;
	private final BCryptPasswordEncoder passwordEncoder;
	private final AccountBookRepository accountBookRepository;

	@Transactional
	public SignupResponse signup(SignupRequest request) {
		if (userRepository.existsByEmail(request.getEmail())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다.");
		}
		User user = userRepository.save(
			User.builder()
				.name(DEFAULT_NAME)
				.email(request.getEmail())
				.password(passwordEncoder.encode(request.getPassword()))
				.build());

		Account newAccount = accountRepository.save(
			Account.builder().user(user).accountNumber(request.getAccountNum())
				.bankName(DEFAULT_BANK_NAME)
				.moneyAmount(new BigDecimal("1000000"))
				.rewardAmount(BigDecimal.ZERO)
				.totalAmount(new BigDecimal("10000000"))
				.build());

		accountBookRepository.save(AccountBook.builder()
			.user(user)
			.account(newAccount)
			.title("첫 계좌연결")
			.amount(BigDecimal.ZERO)
			.spendDate(LocalDateTime.now())
			.category(AccountBookCategory.Etc)
			.build());

		return SignupResponse.builder()
			.userId(user.getId())
			.email(user.getEmail())
			.name(user.getName())
			.build();
	}

	@Transactional
	public AuthResponse login(LoginRequest request) {
		User user = userRepository.findByEmail(request.getEmail())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."));

		if (user.getDeletedAt() != null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.");
		}

		if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.");
		}
		refreshTokenRepository.deleteAllByUser(user);

		return buildAuthResponse(user);
	}

	@Transactional
	public OtpResponse getOtpToken(OtpRequest request) {
		User user = userRepository.findByEmail(request.getEmail())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "존재하지 않는 이메일입니다."));
		String token = UUID.randomUUID().toString();
		verificationRepository.save(Verification.builder()
			.user(user)
			.identifier(request.getEmail())
			.token(token)
			.expiresAt(LocalDateTime.now().plusMinutes(15))
			.build());

		return OtpResponse.builder()
			.token(token)
			.build();
	}

	@Transactional
	public RefreshResponse refreshToken(RefreshRequest request) {
		if (!jwtProvider.validateToken(request.getRefreshToken())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "유효하지 않은 리프레시 토큰입니다.");
		}

		RefreshToken stored = refreshTokenRepository.findByToken(request.getRefreshToken())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "존재하지 않는 리프레시 토큰입니다."));

		if (stored.isExpired()) {
			refreshTokenRepository.delete(stored);
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "만료된 리프레시 토큰입니다.");
		}

		User user = stored.getUser();
		refreshTokenRepository.delete(stored);

		String newRefreshToken = jwtProvider.generateRefreshToken(user.getId());
		refreshTokenRepository.save(RefreshToken.builder()
			.user(user)
			.token(newRefreshToken)
			.expiresAt(jwtProvider.getExpiration(newRefreshToken))
			.build());

		return RefreshResponse.builder()
			.accessToken(jwtProvider.generateAccessToken(user.getId(), user.getEmail()))
			.refreshToken(newRefreshToken)
			.build();
	}

	@Transactional
	public void logout(String refreshToken) {
		refreshTokenRepository.findByToken(refreshToken)
			.ifPresent(refreshTokenRepository::delete);
	}

	@Transactional
	public void deleteAccount(Long userId, DeleteAccountRequest request) {
		User user = userRepository.findById(userId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증 정보가 유효하지 않습니다."));

		if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "비밀번호가 올바르지 않습니다.");
		}

		refreshTokenRepository.deleteAllByUser(user);
		userRepository.softDeleteByEmail(user.getEmail(), LocalDateTime.now());
	}

	@Transactional
	public AuthResponse verifyMagicLink(String token) {
		Verification verification = verificationRepository.findByToken(token)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 토큰입니다."));

		if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
			throw new ResponseStatusException(HttpStatus.GONE, "만료된 토큰입니다.");
		}

		User user = verification.getUser();
		verificationRepository.deleteByToken(token);
		return buildAuthResponse(user);
	}

	@Transactional
	public void resetPassword(String token, String newPassword) {
		Verification verification = verificationRepository.findByToken(token)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 토큰입니다."));

		if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
			throw new ResponseStatusException(HttpStatus.GONE, "만료된 토큰입니다.");
		}

		User user = verification.getUser();
		refreshTokenRepository.deleteAllByUser(user);
		userRepository.updatePassword(user.getId(), passwordEncoder.encode(newPassword));
		verificationRepository.deleteByToken(token);
	}

	@Transactional
	public void changePassword(Long userId, ChangePasswordRequest request) {
		User user = userRepository.findById(userId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증 정보가 유효하지 않습니다."));

		if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "현재 비밀번호가 일치하지 않습니다.");
		}

		refreshTokenRepository.deleteAllByUser(user);
		userRepository.updatePassword(userId, passwordEncoder.encode(request.getNewPassword()));
	}

	private AuthResponse buildAuthResponse(User user) {
		String accessToken = jwtProvider.generateAccessToken(user.getId(), user.getEmail());
		String refreshToken = jwtProvider.generateRefreshToken(user.getId());

		refreshTokenRepository.save(RefreshToken.builder()
			.user(user)
			.token(refreshToken)
			.expiresAt(jwtProvider.getExpiration(refreshToken))
			.build());

		return AuthResponse.builder()
			.accessToken(accessToken)
			.refreshToken(refreshToken)
			.userId(user.getId())
			.email(user.getEmail())
			.name(user.getName())
			.build();
	}
}
