package com.mgk.bemgk.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class RefreshRequest {

    @NotBlank
    private String refreshToken;
}
