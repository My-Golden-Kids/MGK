package com.mgk.bemgk.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.mgk.bemgk.dto.medical.CreateMedicalRecordRequest;
import com.mgk.bemgk.dto.medical.MedicalRecordResponse;
import com.mgk.bemgk.dto.medical.OcrResponseDto;
import com.mgk.bemgk.entity.MedicalDocumentType;
import com.mgk.bemgk.service.MedicalService;
import com.mgk.bemgk.service.OcrService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/medical-records")
@RequiredArgsConstructor
@Validated
public class MedicalOcrController {
	private final OcrService ocrService;
	private final MedicalService medicalService;

	@PostMapping("/ocr")
	public ResponseEntity<OcrResponseDto> uploadAndOcr(@RequestParam("file") MultipartFile file) {
		return ResponseEntity.ok(ocrService.processMedicalReceipt(file));
	}

	@PostMapping
	public ResponseEntity<MedicalRecordResponse> createMedicalRecord(
		@Valid @RequestBody CreateMedicalRecordRequest request
	) {
		return ResponseEntity.ok(medicalService.createMedicalRecord(request));
	}

	@GetMapping
	public ResponseEntity<List<MedicalRecordResponse>> getMedicalRecords(
		@RequestParam(value = "type", required = false) MedicalDocumentType type
	) {
		return ResponseEntity.ok(medicalService.getMedicalRecords(type));
	}
}
