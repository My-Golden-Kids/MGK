package com.mgk.bemgk.repository;

import com.mgk.bemgk.entity.MedicalDocument;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MedicalDocumentRepository extends JpaRepository<MedicalDocument, Long> {

    // 접종 횟수 count : type + name별 횟수를 세는 group by 쿼리
    @Query("""
            select
                m.pet.id as petId,
                m.type as type,
                m.name as name,
                count(m) as documentCount
            from MedicalDocument m
            where m.pet.id = :petId
              and (:type is null or m.type = :type)
            group by m.pet.id, m.type, m.name
            order by m.type, m.name
            """)
    List<MedicalDocumentCountProjection> findDocumentCountsByPetIdAndType(
            @Param("petId") Long petId,
            @Param("type") String type
    );
}
