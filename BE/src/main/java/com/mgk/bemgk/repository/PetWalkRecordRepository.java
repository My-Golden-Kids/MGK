package com.mgk.bemgk.repository;

import com.mgk.bemgk.entity.PetWalkRecord;
import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

public interface PetWalkRecordRepository extends JpaRepository<PetWalkRecord, Long> {

    void deleteByPet_Id(Long petId);

    List<PetWalkRecord> findAllByPet_IdAndCompletedTrueOrderByWalkedAtDesc(Long petId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<PetWalkRecord> findByPet_IdAndSource(Long petId, String source);

    Optional<PetWalkRecord> findFirstByPet_IdAndWalkedAtBetweenAndSourceStartingWithOrderByUpdatedAtDesc(
            Long petId,
            LocalDateTime startAt,
            LocalDateTime endAt,
            String sourcePrefix
    );

    List<PetWalkRecord> findAllByPet_User_IdAndCompletedTrue(Long userId);
}
