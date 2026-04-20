package com.mgk.bemgk.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import com.google.cloud.vision.v1.AnnotateImageResponse;
import com.google.cloud.vision.v1.BatchAnnotateImagesResponse;
import com.google.cloud.vision.v1.TextAnnotation;
import com.google.cloud.vision.v1.ImageAnnotatorClient;
import com.google.rpc.Status;
import com.mgk.bemgk.dto.medical.OcrResponseDto;
import com.mgk.bemgk.entity.MedicalDocumentType;

@ExtendWith(MockitoExtension.class)
class OcrServiceTest {

	@Mock
	private ImageAnnotatorClient visionClient;

	@InjectMocks
	private OcrService ocrService;

	@Test
	void processMedicalReceipt_andPrivateHelpers_coverParsingBranches() {
		String rawText = """
			2026-04-16 14:30
			반려동물명: 멩이
			하나동물병원
			종합백신 접종 30,000원
			진료 20,000원
			총 진료비 50,000원
			""";

		AnnotateImageResponse response = AnnotateImageResponse.newBuilder()
			.setFullTextAnnotation(TextAnnotation.newBuilder().setText(rawText).build())
			.build();
		when(visionClient.batchAnnotateImages(org.mockito.ArgumentMatchers.anyList()))
			.thenReturn(BatchAnnotateImagesResponse.newBuilder().addResponses(response).build());

		OcrResponseDto dto = ocrService.processMedicalReceipt(
			new MockMultipartFile("file", "receipt.png", "image/png", "fake-image".getBytes())
		);

		assertThat(dto.getDate()).isEqualTo("2026-04-16");
		assertThat(dto.getTime()).isEqualTo("14:30");
		assertThat(dto.getType()).isEqualTo(MedicalDocumentType.VACCINATION);
		assertThat(dto.getPetName()).isEqualTo("멩이");
		assertThat(dto.getHospitalName()).isEqualTo("하나동물병원");
		assertThat(dto.getDetails()).contains("종합백신 접종");
		assertThat(dto.getTotalAmount()).isEqualTo(50000);

		assertThat((Object)ReflectionTestUtils.invokeMethod(ocrService, "extractDate", "2026년 4월 16일"))
			.isEqualTo(Optional.of(LocalDate.of(2026, 4, 16)));
		assertThat((Object)ReflectionTestUtils.invokeMethod(ocrService, "extractType", "예방 접종 백신"))
			.isEqualTo(MedicalDocumentType.VACCINATION);
		assertThat((Object)ReflectionTestUtils.invokeMethod(ocrService, "extractPetName", List.of("환자명: 멩이")))
			.isEqualTo(Optional.of("멩이"));
		assertThat((Object)ReflectionTestUtils.invokeMethod(ocrService, "extractTime", List.of("오전 9시 30분")))
			.isEqualTo(Optional.of("09:30"));
		assertThat((Object)ReflectionTestUtils.invokeMethod(ocrService, "extractHospitalName", List.of("하나동물병원", "기타")))
			.isEqualTo(Optional.of("하나동물병원"));
		assertThat((Object)ReflectionTestUtils.invokeMethod(ocrService, "extractDetails", List.of("보호자명: 홍길동", "기본 진료 10,000원", "종합백신 접종 30,000원")))
			.isEqualTo(Optional.of("기본 진료 / 종합백신 접종"));
		assertThat((Object)ReflectionTestUtils.invokeMethod(ocrService, "extractAmount", List.of("합계 50,000원", "10,000원")))
			.isEqualTo(Optional.of(50000));
		assertThat((Object)ReflectionTestUtils.invokeMethod(ocrService, "normalizeTime", "오후", "2", "30", "오후 2시 30분"))
			.isEqualTo(Optional.of("14:30"));
		assertThat((Object)ReflectionTestUtils.invokeMethod(ocrService, "containsPhoneNumber", "02-123-4567"))
			.isEqualTo(true);
		assertThat((Object)ReflectionTestUtils.invokeMethod(ocrService, "containsAddress", "서울특별시 중구 세종대로"))
			.isEqualTo(true);
	}

	@Test
	void processMedicalReceipt_throwsOnVisionError() {
		AnnotateImageResponse response = AnnotateImageResponse.newBuilder()
			.setError(Status.newBuilder().setMessage("vision failed").build())
			.build();
		when(visionClient.batchAnnotateImages(org.mockito.ArgumentMatchers.anyList()))
			.thenReturn(BatchAnnotateImagesResponse.newBuilder().addResponses(response).build());

		assertThatThrownBy(() -> ocrService.processMedicalReceipt(
			new MockMultipartFile("file", "receipt.png", "image/png", "fake-image".getBytes())
		)).isInstanceOf(ResponseStatusException.class);
	}
}
