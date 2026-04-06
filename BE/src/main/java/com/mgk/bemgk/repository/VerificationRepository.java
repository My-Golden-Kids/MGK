package com.mgk.bemgk.repository;

import com.mgk.bemgk.entity.Verification;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VerificationRepository extends JpaRepository<Verification, Long> {

    Optional<Verification> findTopByIdentifierOrderByCreatedAtDesc(String identifier);
}
