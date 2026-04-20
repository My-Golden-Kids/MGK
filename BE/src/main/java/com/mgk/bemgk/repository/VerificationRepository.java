package com.mgk.bemgk.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mgk.bemgk.entity.Verification;

public interface VerificationRepository extends JpaRepository<Verification, Long> {

	Optional<Verification> findTopByIdentifierOrderByCreatedAtDesc(String identifier);

	Optional<Verification> findByToken(String token);

	void deleteByToken(String token);
}
