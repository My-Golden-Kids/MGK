package com.mgk.bemgk.repository;

import com.mgk.bemgk.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CalendarRepository extends JpaRepository<CalendarEvent, Long> {
}
