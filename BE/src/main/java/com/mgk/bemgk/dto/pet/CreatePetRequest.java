package com.mgk.bemgk.dto.pet;

import jakarta.validation.constraints.NotBlank;

public record CreatePetRequest(
        @NotBlank(message = "반려동물 이름은 비어 있을 수 없습니다.")
        String name,
        String imageUrl,
        Double age,
        String species,
        String size,
        Boolean isDeath
) {
}
