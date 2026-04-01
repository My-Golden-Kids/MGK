package com.mgk.bemgk.repository;

import com.mgk.bemgk.entity.Pet;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PetRepository extends JpaRepository<Pet, Long> {
}
