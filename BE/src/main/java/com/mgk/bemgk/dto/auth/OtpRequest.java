package com.mgk.bemgk.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class OtpRequest {

    @NotBlank
    @Email
    private String email;

    private String password;
}
