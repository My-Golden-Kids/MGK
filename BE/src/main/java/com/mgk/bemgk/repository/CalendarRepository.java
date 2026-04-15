package com.mgk.bemgk.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.mgk.bemgk.entity.CalendarEvent;

public interface CalendarRepository extends JpaRepository<CalendarEvent, Long> {

	void deleteByPet_Id(Long petId);

	List<CalendarEvent> findByPet_User_IdAndDateBetweenOrderByDate(Long userId, LocalDate start, LocalDate end);

	Optional<CalendarEvent> findFirstByPet_IdAndDateGreaterThanEqualOrderByDateAsc(Long petId, LocalDate date);

	Optional<CalendarEvent> findFirstByPet_IdAndEventTypeAndDateGreaterThanEqualOrderByDateAsc(
		Long petId, String eventType, LocalDate date);

	List<CalendarEvent> findByPet_IdAndEventTypeAndDateGreaterThanEqualOrderByDateAsc(
		Long petId, String eventType, LocalDate date);

	@Query("""
		SELECT c FROM CalendarEvent c
		JOIN FETCH c.pet
		WHERE c.pet.user.id = :userId
			AND c.date = :date ORDER BY c.date
		""")
	List<CalendarEvent> findByPet_User_IdAndDateOrderByDate(Long userId, LocalDate date);
}
