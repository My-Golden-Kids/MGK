package com.mgk.bemgk.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.mgk.bemgk.entity.User;
import com.mgk.bemgk.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class CurrentUserServiceTest {

	@Mock
	private UserRepository userRepository;

	@InjectMocks
	private CurrentUserService currentUserService;

	@AfterEach
	void tearDown() {
		SecurityContextHolder.clearContext();
	}

	@Test
	void getCurrentUserId_returnsAuthenticatedPrincipal() {
		SecurityContextHolder.getContext().setAuthentication(
			new UsernamePasswordAuthenticationToken(7L, null)
		);

		assertThat(currentUserService.getCurrentUserId()).isEqualTo(7L);
	}

	@Test
	void getCurrentUserId_throwsWhenUnauthenticated() {
		assertThatThrownBy(() -> currentUserService.getCurrentUserId())
			.hasMessageContaining("401 UNAUTHORIZED");
	}

	@Test
	void getCurrentUserIdOrDefault_returnsRepositoryUserWhenNoAuthentication() {
		User user = User.builder().name("기본").email("default@test.com").password("pw").build();
		org.springframework.test.util.ReflectionTestUtils.setField(user, "id", 1L);
		when(userRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(user));

		assertThat(currentUserService.getCurrentUserIdOrDefault()).isEqualTo(1L);
	}
}
