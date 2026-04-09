package com.mgk.bemgk.repository;

import com.mgk.bemgk.entity.Pet;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PetRepository extends JpaRepository<Pet, Long> {

    List<Pet> findByUser_Id(Long userId);
}
