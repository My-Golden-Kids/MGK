package com.mgk.bemgk.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mgk.bemgk.entity.Pet;

public interface PetRepository extends JpaRepository<Pet, Long> {

	List<Pet> findByUser_Id(Long userId);

	Optional<Pet> findByIdAndUser_Id(Long id, Long userId);
}
