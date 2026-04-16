package com.mgk.bemgk.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

	@Mock
	private JwtProvider jwtProvider;

	@AfterEach
	void tearDown() {
		SecurityContextHolder.clearContext();
	}

	@Test
	void doFilterInternal_setsAuthenticationWhenBearerTokenIsValid() throws Exception {
		JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtProvider);
		MockHttpServletRequest request = new MockHttpServletRequest();
		request.addHeader("Authorization", "Bearer valid-token");

		when(jwtProvider.validateToken("valid-token")).thenReturn(true);
		when(jwtProvider.getUserId("valid-token")).thenReturn(7L);
		when(jwtProvider.getEmail("valid-token")).thenReturn("user@test.com");

		filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		assertThat(authentication).isNotNull();
		assertThat(authentication.getPrincipal()).isEqualTo(7L);
		assertThat(authentication.getCredentials()).isEqualTo("user@test.com");
		assertThat(authentication.getAuthorities()).extracting("authority").containsExactly("ROLE_USER");
	}

	@Test
	void doFilterInternal_skipsAuthenticationWhenTokenIsMissing() throws Exception {
		JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtProvider);

		filter.doFilter(new MockHttpServletRequest(), new MockHttpServletResponse(), new MockFilterChain());

		assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
	}

	@Test
	void doFilterInternal_skipsAuthenticationWhenTokenIsInvalid() throws Exception {
		JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtProvider);
		MockHttpServletRequest request = new MockHttpServletRequest();
		request.addHeader("Authorization", "Bearer invalid-token");

		when(jwtProvider.validateToken("invalid-token")).thenReturn(false);

		filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

		verify(jwtProvider).validateToken("invalid-token");
		assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
	}
}
