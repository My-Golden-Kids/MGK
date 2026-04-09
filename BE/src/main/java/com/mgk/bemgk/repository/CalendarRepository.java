package com.mgk.bemgk.repository;

import com.mgk.bemgk.entity.CalendarEvent;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CalendarRepository extends JpaRepository<CalendarEvent, Long> {

    List<CalendarEvent> findByPet_User_IdAndDateBetweenOrderByDate(Long userId, LocalDate start, LocalDate end);

    Optional<CalendarEvent> findFirstByPet_IdAndDateGreaterThanEqualOrderByDateAsc(Long petId, LocalDate date);

    Optional<CalendarEvent> findFirstByPet_IdAndEventTypeAndDateGreaterThanEqualOrderByDateAsc(
            Long petId, String eventType, LocalDate date);
}
