package com.mgk.bemgk.dto.pet;

import java.time.LocalDateTime;

import com.mgk.bemgk.entity.Pet;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PetResponse {

	private Long id;
	private String name;
	private String imageUrl;
	private Double age;
	private String species;
	private String size;
	private Boolean isDeath;
	private LocalDateTime deathDate;

	public static PetResponse from(Pet pet) {
		return PetResponse.builder()
			.id(pet.getId())
			.name(pet.getName())
			.imageUrl(pet.getImage())
			.age(pet.getAge())
			.species(pet.getSpecies())
			.size(pet.getSize() != null ? pet.getSize().name() : null)
			.isDeath(pet.isDead())
			.deathDate(pet.getDeathDate())
			.build();
	}
}
