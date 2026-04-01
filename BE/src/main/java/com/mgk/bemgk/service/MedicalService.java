package com.mgk.bemgk.service;

import com.mgk.bemgk.dto.medical.MedicalDocumentCountResponse;
import com.mgk.bemgk.repository.MedicalDocumentRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MedicalService {

    private final MedicalDocumentRepository medicalDocumentRepository;

    // 접종 횟수 count -> DTO 변환 로직
    public List<MedicalDocumentCountResponse> getMedicalDocumentCounts(Long petId, String type) {
        return medicalDocumentRepository.findDocumentCountsByPetIdAndType(petId, type)
                .stream()
                .map(result -> MedicalDocumentCountResponse.builder()
                        .petId(result.getPetId())
                        .type(result.getType())
                        .name(result.getName())
                        .count(result.getDocumentCount())
                        .build())
                .toList();
    }
}
