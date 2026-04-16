package com.mgk.bemgk.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mgk.bemgk.dto.medical.MedicalRecordResponse;
import com.mgk.bemgk.dto.medical.OcrResponseDto;
import com.mgk.bemgk.entity.MedicalDocumentType;
import com.mgk.bemgk.service.MedicalService;
import com.mgk.bemgk.service.OcrService;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class MedicalOcrControllerTest {

	private final ObjectMapper objectMapper = new ObjectMapper();
	private MockMvc mockMvc;

	@Mock
	private OcrService ocrService;

	@Mock
	private MedicalService medicalService;

	@InjectMocks
	private MedicalOcrController medicalOcrController;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(medicalOcrController).build();
	}

	@Test
	void uploadAndOcr_returnsOcrPayload() throws Exception {
		MockMultipartFile file = new MockMultipartFile("file", "receipt.jpg", "image/jpeg", "x".getBytes());
		when(ocrService.processMedicalReceipt(file)).thenReturn(OcrResponseDto.builder()
			.petName("멩이")
			.hospitalName("동물병원")
			.totalAmount(50000)
			.build());

		mockMvc.perform(multipart("/api/medical-records/ocr").file(file))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.petName").value("멩이"))
			.andExpect(jsonPath("$.totalAmount").value(50000));
	}

	@Test
	void createAndGetMedicalRecords_returnPayload() throws Exception {
		when(medicalService.createMedicalRecord(org.mockito.ArgumentMatchers.any()))
			.thenReturn(MedicalRecordResponse.builder()
				.id(1L)
				.petId(2L)
				.petName("멩이")
				.hospitalName("동물병원")
				.type(MedicalDocumentType.CHECKUP)
				.date("2026-04-16")
				.totalAmount(50000)
				.build());
		when(medicalService.getMedicalRecords(MedicalDocumentType.CHECKUP))
			.thenReturn(List.of(MedicalRecordResponse.builder()
				.id(1L)
				.petId(2L)
				.petName("멩이")
				.hospitalName("동물병원")
				.type(MedicalDocumentType.CHECKUP)
				.date("2026-04-16")
				.totalAmount(50000)
				.build()));

		mockMvc.perform(post("/api/medical-records")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"date":"2026-04-16","type":"CHECKUP","petName":"멩이","hospitalName":"동물병원","details":"정기검진","totalAmount":50000}
					"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.petName").value("멩이"));

		mockMvc.perform(get("/api/medical-records").param("type", "CHECKUP"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].hospitalName").value("동물병원"));
	}
}
