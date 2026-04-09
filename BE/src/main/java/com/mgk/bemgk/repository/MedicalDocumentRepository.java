package com.mgk.bemgk.repository;

import com.mgk.bemgk.entity.MedicalDocument;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MedicalDocumentRepository extends JpaRepository<MedicalDocument, Long> {

    List<MedicalDocument> findByPet_IdOrderByDateDescCreatedAtDesc(Long petId);

    List<MedicalDocument> findByPet_IdAndTypeOrderByDateDescCreatedAtDesc(Long petId, String type);

    @Query("""
            select
                m.pet.id as petId,
                m.type as type,
                m.details as details,
                count(m) as documentCount
            from MedicalDocument m
            where m.pet.id = :petId
              and (:type is null or m.type = :type)
            group by m.pet.id, m.type, m.details
            order by m.type, m.details
            """)
    List<MedicalDocumentCountProjection> findDocumentCountsByPetIdAndType(
            @Param("petId") Long petId,
            @Param("type") String type
    );
}
