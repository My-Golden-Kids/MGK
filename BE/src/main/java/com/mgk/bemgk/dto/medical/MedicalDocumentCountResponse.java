package com.mgk.bemgk.dto.medical;

import com.mgk.bemgk.entity.MedicalDocumentType;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MedicalDocumentCountResponse {

	private Long petId;
	private MedicalDocumentType type;
	private String details;
	private Long count;
}
