package com.mgk.bemgk.service;

import com.mgk.bemgk.auth.JwtProvider;
import com.mgk.bemgk.dto.auth.AuthResponse;
import com.mgk.bemgk.dto.auth.LoginRequest;
import com.mgk.bemgk.dto.auth.OtpRequest;
import com.mgk.bemgk.dto.auth.OtpResponse;
import com.mgk.bemgk.dto.auth.RefreshRequest;
import com.mgk.bemgk.dto.auth.RefreshResponse;
import com.mgk.bemgk.dto.auth.SignupRequest;
import com.mgk.bemgk.entity.Account;
import com.mgk.bemgk.entity.User;
import com.mgk.bemgk.entity.Verification;
import com.mgk.bemgk.repository.AccountRepository;
import com.mgk.bemgk.repository.UserRepository;
import com.mgk.bemgk.repository.VerificationRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
	private static final String DEFAULT_NAME = "김돌멩";
	private static final String DEFAULT_BANK_NAME = "HanaBank";

	private final UserRepository userRepository;
	private final AccountRepository accountRepository;
	private final VerificationRepository verificationRepository;
	private final JwtProvider jwtProvider;
    private final BCryptPasswordEncoder passwordEncoder;

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        User user = userRepository.save(User.builder()
                .name(DEFAULT_NAME)
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build());

        accountRepository.save(Account.builder()
                .user(user)
                .accountNumber(request.getAccountNum())
                .bankName(DEFAULT_BANK_NAME)
                .moneyAmount(BigDecimal.ZERO)
                .rewardAmount(BigDecimal.ZERO)
                .totalAmount(BigDecimal.ZERO)
                .build());

        return buildAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        return buildAuthResponse(user);
    }

    @Transactional
    public OtpResponse getOtpToken(OtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 이메일입니다."));

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

    @Transactional(readOnly = true)
    public RefreshResponse refreshToken(RefreshRequest request) {
        if (!jwtProvider.validateToken(request.getRefreshToken())) {
            throw new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다.");
        }

        Long userId = jwtProvider.getUserId(request.getRefreshToken());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));

        return RefreshResponse.builder()
                .accessToken(jwtProvider.generateAccessToken(user.getId(), user.getEmail()))
                .build();
    }

    public void logout(String refreshToken) {
        // stateless — 클라이언트에서 토큰 폐기
    }

    @Transactional
    public void deleteAccount(String email) {
        userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 이메일입니다."));
        userRepository.softDeleteByEmail(email, LocalDateTime.now());
    }

    @Transactional
    public AuthResponse verifyMagicLink(String token) {
        Verification verification = verificationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 토큰입니다."));

        if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("만료된 토큰입니다.");
        }

        User user = verification.getUser();
        verificationRepository.deleteByToken(token);
        return buildAuthResponse(user);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        Verification verification = verificationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 토큰입니다."));

        if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("만료된 토큰입니다.");
        }

        User user = verification.getUser();
        userRepository.updatePassword(user.getId(), passwordEncoder.encode(newPassword));
        verificationRepository.deleteByToken(token);
    }

    private AuthResponse buildAuthResponse(User user) {
        return AuthResponse.builder()
                .accessToken(jwtProvider.generateAccessToken(user.getId(), user.getEmail()))
                .refreshToken(jwtProvider.generateRefreshToken(user.getId()))
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .build();
    }
}
