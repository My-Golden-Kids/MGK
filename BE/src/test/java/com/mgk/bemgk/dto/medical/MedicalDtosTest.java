package com.mgk.bemgk.dto.medical;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.mgk.bemgk.entity.MedicalDocument;
import com.mgk.bemgk.entity.MedicalDocumentType;
import com.mgk.bemgk.entity.Pet;

class MedicalDtosTest {

	@Test
	void medicalDtosExposeFieldsAndStaticMappings() {
		CreateMedicalRecordRequest request = new CreateMedicalRecordRequest(
			1L,
			"2026-04-16",
			MedicalDocumentType.CHECKUP,
			"멩이",
			"하나동물병원",
			"정기 검진",
			50000,
			"https://image"
		);

		Pet pet = Pet.builder().name("멩이").build();
		ReflectionTestUtils.setField(pet, "id", 1L);

		MedicalDocument medicalDocument = new MedicalDocument();
		ReflectionTestUtils.setField(medicalDocument, "id", 11L);
		ReflectionTestUtils.setField(medicalDocument, "pet", pet);
		ReflectionTestUtils.setField(medicalDocument, "petName", "멩이");
		ReflectionTestUtils.setField(medicalDocument, "date", LocalDate.of(2026, 4, 16));
		ReflectionTestUtils.setField(medicalDocument, "type", MedicalDocumentType.CHECKUP);
		ReflectionTestUtils.setField(medicalDocument, "hospitalName", "하나동물병원");
		ReflectionTestUtils.setField(medicalDocument, "details", "정기 검진");
		ReflectionTestUtils.setField(medicalDocument, "totalAmount", 50000);
		ReflectionTestUtils.setField(medicalDocument, "imageUrl", "https://image");

		MedicalDocumentCountResponse countResponse = MedicalDocumentCountResponse.builder()
			.petId(1L)
			.type(MedicalDocumentType.CHECKUP)
			.details("검진")
			.count(3L)
			.build();
		MedicalRecordResponse recordResponse = MedicalRecordResponse.from(medicalDocument);
		OcrResponseDto ocrResponseDto = OcrResponseDto.builder()
			.date("2026-04-16")
			.time("10:00")
			.type(MedicalDocumentType.CHECKUP)
			.petName("멩이")
			.hospitalName("하나동물병원")
			.details("정기 검진")
			.totalAmount(50000)
			.rawText("OCR TEXT")
			.build();

		assertThat(request.petId()).isEqualTo(1L);
		assertThat(request.petName()).isEqualTo("멩이");
		assertThat(countResponse.getCount()).isEqualTo(3L);
		assertThat(recordResponse.getId()).isEqualTo(11L);
		assertThat(recordResponse.getPetId()).isEqualTo(1L);
		assertThat(recordResponse.getDate()).isEqualTo("2026-04-16");
		assertThat(recordResponse.getHospitalName()).isEqualTo("하나동물병원");
		assertThat(ocrResponseDto.getRawText()).isEqualTo("OCR TEXT");
	}
}
