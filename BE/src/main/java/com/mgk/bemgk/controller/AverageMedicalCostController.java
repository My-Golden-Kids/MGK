package com.mgk.bemgk.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mgk.bemgk.service.AverageMedicalCostService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/dashboard")
public class AverageMedicalCostController {

	private final AverageMedicalCostService service;

	@PostMapping("/average-cost")
	public String get(@RequestParam(required = false) Long petId, @RequestParam String item) {
		return service.answerByItem(petId, item);
	}
}
