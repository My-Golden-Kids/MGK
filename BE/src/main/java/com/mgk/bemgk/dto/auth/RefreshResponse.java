package com.mgk.bemgk.dto.auth;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RefreshResponse {

	private String accessToken;
	private String refreshToken;
}
