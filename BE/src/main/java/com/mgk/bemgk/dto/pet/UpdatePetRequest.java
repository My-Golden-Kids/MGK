package com.mgk.bemgk.dto.pet;

public record UpdatePetRequest(
        String name,
        Double age,
        String species,
        String size,
        String imageUrl
) {
}
