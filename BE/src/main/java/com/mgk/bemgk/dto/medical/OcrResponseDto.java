package com.mgk.bemgk.dto.medical;

import com.mgk.bemgk.entity.MedicalDocumentType;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OcrResponseDto {

	private String date;
	private String time;
	private MedicalDocumentType type;
	private String petName;
	private String hospitalName;
	private String details;
	private Integer totalAmount;
	private String rawText;
}
