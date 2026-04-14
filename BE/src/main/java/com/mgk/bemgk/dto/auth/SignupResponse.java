package com.mgk.bemgk.dto.auth;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SignupResponse {

	private Long userId;
	private String email;
	private String name;
}
