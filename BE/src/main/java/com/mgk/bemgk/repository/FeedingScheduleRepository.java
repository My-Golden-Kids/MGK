package com.mgk.bemgk.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mgk.bemgk.entity.FeedingSchedule;

public interface FeedingScheduleRepository extends JpaRepository<FeedingSchedule, Long> {

	Optional<FeedingSchedule> findByPetId(Long petId);

	List<FeedingSchedule> findByPet_User_IdAndPet_DeathFalse(Long userId);
}
