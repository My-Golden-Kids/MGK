package com.mgk.bemgk.dto.auth;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class OtpRequest {
	private String email;
	private String password;
}
