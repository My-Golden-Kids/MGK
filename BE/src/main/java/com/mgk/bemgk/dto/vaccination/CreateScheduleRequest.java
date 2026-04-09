package com.mgk.bemgk.dto.vaccination;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CreateScheduleRequest {

    @NotNull
    private Long petId;

    @NotBlank
    private String eventType; // VACCINATION | CHECKUP

    @NotNull
    private LocalDate date;

    @NotBlank
    @Size(max = 200)
    private String name;

    @Size(max = 1000)
    private String memo;
}
