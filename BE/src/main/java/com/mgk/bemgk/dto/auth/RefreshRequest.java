package com.mgk.bemgk.dto.auth;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class RefreshRequest {
	private String token;
}
