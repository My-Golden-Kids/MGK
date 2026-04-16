package com.mgk.bemgk.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordRequest {

	@NotBlank
	private String token;

	@NotBlank
	private String newPassword;
}
