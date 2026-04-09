package com.mgk.bemgk.dto.medical;

import com.mgk.bemgk.entity.MedicalDocumentType;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateMedicalRecordRequest(
        @NotNull Long petId,
        @NotBlank String date,
        @NotBlank MedicalDocumentType type,
        @NotBlank String petName,
        @NotBlank String hospitalName,
        @NotBlank String details,
        @NotNull @Min(0) Integer totalAmount,
        String imageUrl
) {
}
