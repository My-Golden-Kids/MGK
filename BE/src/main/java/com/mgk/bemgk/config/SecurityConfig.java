package com.mgk.bemgk.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.mgk.bemgk.auth.JwtAuthenticationFilter;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

	private final JwtAuthenticationFilter jwtAuthenticationFilter;

	@Bean
	public BCryptPasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		return http
			.csrf(AbstractHttpConfigurer::disable)
			.cors(Customizer.withDefaults())
			.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
			.authorizeHttpRequests(auth -> auth
				// CORS preflight — 브라우저 요청 전 OPTIONS 차단 시 전체 터짐
				.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
				// monitoring
				.requestMatchers(HttpMethod.GET, "/actuator/health").permitAll()
				.requestMatchers(HttpMethod.GET, "/actuator/prometheus").permitAll()
				// 인증 없이 접근 가능한 auth 엔드포인트
				.requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
				.requestMatchers(HttpMethod.POST, "/api/auth/signup").permitAll()
				.requestMatchers(HttpMethod.POST, "/api/auth/send-otp").permitAll()
				.requestMatchers(HttpMethod.POST, "/api/auth/refresh").permitAll()
				.requestMatchers(HttpMethod.POST, "/api/auth/verify").permitAll()
				.requestMatchers(HttpMethod.POST, "/api/auth/reset-password").permitAll()
				// 나머지 모든 경로는 인증 필요
				.anyRequest().authenticated()
			)
			.exceptionHandling(ex -> ex
				// 인증되지 않은 요청 → 302 리다이렉트 대신 401 JSON 반환
				.authenticationEntryPoint((request, response, authException) -> {
					response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
					response.setContentType("application/json;charset=UTF-8");
					response.getWriter().write(
						"{\"error\":\"UNAUTHORIZED\",\"message\":\"로그인이 필요합니다.\"}"
					);
				})
				// 인증은 됐으나 권한 부족 → 403 JSON 반환
				.accessDeniedHandler((request, response, accessDeniedException) -> {
					response.setStatus(HttpServletResponse.SC_FORBIDDEN);
					response.setContentType("application/json;charset=UTF-8");
					response.getWriter().write(
						"{\"error\":\"FORBIDDEN\",\"message\":\"접근 권한이 없습니다.\"}"
					);
				})
			)
			.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
			.build();
	}
}
