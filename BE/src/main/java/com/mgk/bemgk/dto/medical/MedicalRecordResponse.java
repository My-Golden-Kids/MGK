package com.mgk.bemgk.dto.medical;

import com.mgk.bemgk.entity.MedicalDocument;
import com.mgk.bemgk.entity.MedicalDocumentType;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MedicalRecordResponse {

    private Long id;
    private Long petId;
    private String date;
    private MedicalDocumentType type;
    private String petName;
    private String hospitalName;
    private String details;
    private Integer totalAmount;
    private String imageUrl;

    public static MedicalRecordResponse from(MedicalDocument medicalDocument) {
        return MedicalRecordResponse.builder()
                .id(medicalDocument.getId())
                .petId(medicalDocument.getPet().getId())
                .date(medicalDocument.getDate().toString())
                .type(medicalDocument.getType())
                .petName(medicalDocument.getPetName())
                .hospitalName(medicalDocument.getHospitalName())
                .details(medicalDocument.getDetails())
                .totalAmount(medicalDocument.getTotalAmount())
                .imageUrl(medicalDocument.getImageUrl())
                .build();
    }
}
