package com.mgk.bemgk.service;

import com.mgk.bemgk.dto.medical.CreateMedicalRecordRequest;
import com.mgk.bemgk.dto.medical.MedicalDocumentCountResponse;
import com.mgk.bemgk.dto.medical.MedicalRecordResponse;
import com.mgk.bemgk.entity.MedicalDocument;
import com.mgk.bemgk.entity.MedicalDocumentType;
import com.mgk.bemgk.entity.Pet;
import com.mgk.bemgk.repository.MedicalDocumentRepository;
import com.mgk.bemgk.repository.PetRepository;
import java.util.List;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MedicalService {

    private final MedicalDocumentRepository medicalDocumentRepository;
    private final PetRepository petRepository;

    @Transactional
    public MedicalRecordResponse createMedicalRecord(CreateMedicalRecordRequest request) {
        Pet pet = petRepository.findById(request.petId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 반려동물입니다."));

        MedicalDocument medicalDocument = new MedicalDocument();
        medicalDocument.setPet(pet);
        medicalDocument.setPetName(request.petName());
        medicalDocument.setDate(LocalDate.parse(request.date()));
        medicalDocument.setType(request.type());
        medicalDocument.setHospitalName(request.hospitalName());
        medicalDocument.setDetails(request.details());
        medicalDocument.setTotalAmount(request.totalAmount());
        medicalDocument.setImageUrl(request.imageUrl());

        return MedicalRecordResponse.from(medicalDocumentRepository.save(medicalDocument));
    }

    public List<MedicalRecordResponse> getMedicalRecords(Long petId, MedicalDocumentType type) {
        List<MedicalDocument> documents = type == null
                ? medicalDocumentRepository.findByPet_IdOrderByDateDescCreatedAtDesc(petId)
                : medicalDocumentRepository.findByPet_IdAndTypeOrderByDateDescCreatedAtDesc(petId, type);

        return documents.stream()
                .map(MedicalRecordResponse::from)
                .toList();
    }

    // 접종 횟수 count -> DTO 변환 로직
    public List<MedicalDocumentCountResponse> getMedicalDocumentCounts(Long petId, MedicalDocumentType type) {
        return medicalDocumentRepository.findDocumentCountsByPetIdAndType(petId, type)
                .stream()
                .map(result -> MedicalDocumentCountResponse.builder()
                        .petId(result.getPetId())
                        .type(result.getType())
                        .details(result.getDetails())
                        .count(result.getDocumentCount())
                        .build())
                .toList();
    }
}
