package com.mgk.bemgk.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mgk.bemgk.entity.MapLocation;

public interface MapRepository extends JpaRepository<MapLocation, Long> {
}
