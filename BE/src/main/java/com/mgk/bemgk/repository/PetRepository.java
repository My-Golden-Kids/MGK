package com.mgk.bemgk.repository;

import com.mgk.bemgk.entity.Pet;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PetRepository extends JpaRepository<Pet, Long> {

    List<Pet> findByUser_Id(Long userId);

    Optional<Pet> findByIdAndUser_Id(Long id, Long userId);
}
