package com.mgk.bemgk.repository;

import com.mgk.bemgk.entity.MapLocation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MapRepository extends JpaRepository<MapLocation, Long> {
}
