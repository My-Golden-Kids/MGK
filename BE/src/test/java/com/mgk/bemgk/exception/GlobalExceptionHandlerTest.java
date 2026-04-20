package com.mgk.bemgk.exception;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;

class GlobalExceptionHandlerTest {

	private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

	@Test
	void handlesIllegalArgumentException() {
		HttpServletRequest request = new MockHttpServletRequest("GET", "/api/test");

		ResponseEntity<ApiErrorResponse> response = handler.handleIllegalArgumentException(
			new IllegalArgumentException("잘못된 요청"),
			request
		);

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
		assertThat(response.getBody().message()).isEqualTo("잘못된 요청");
		assertThat(response.getBody().path()).isEqualTo("/api/test");
	}

	@Test
	void handlesResponseStatusException() {
		HttpServletRequest request = new MockHttpServletRequest("GET", "/api/test");

		ResponseEntity<ApiErrorResponse> response = handler.handleResponseStatusException(
			new ResponseStatusException(HttpStatus.NOT_FOUND, "없음"),
			request
		);

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
		assertThat(response.getBody().error()).isEqualTo("Not Found");
		assertThat(response.getBody().message()).isEqualTo("없음");
	}

	@Test
	void handlesMethodArgumentNotValidException() {
		HttpServletRequest request = new MockHttpServletRequest("POST", "/api/test");
		BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "target");
		bindingResult.addError(new FieldError("target", "email", "이메일 형식이 아닙니다."));
		bindingResult.addError(new FieldError("target", "password", "비어 있을 수 없습니다."));

		MethodArgumentNotValidException exception = Mockito.mock(MethodArgumentNotValidException.class);
		when(exception.getBindingResult()).thenReturn(bindingResult);

		ResponseEntity<ApiErrorResponse> response =
			handler.handleMethodArgumentNotValidException(exception, request);

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
		assertThat(response.getBody().message())
			.contains("email: 이메일 형식이 아닙니다.")
			.contains("password: 비어 있을 수 없습니다.");
		assertThat(response.getBody().path()).isEqualTo("/api/test");
	}
}
