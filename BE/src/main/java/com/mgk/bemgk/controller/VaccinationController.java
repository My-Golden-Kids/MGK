package com.mgk.bemgk.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.mgk.bemgk.dto.vaccination.CreateScheduleRequest;
import com.mgk.bemgk.dto.vaccination.ScheduleCalendarEntry;
import com.mgk.bemgk.dto.vaccination.VaccinationPetSummaryResponse;
import com.mgk.bemgk.service.VaccinationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/vaccinations")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class VaccinationController {

	private final VaccinationService vaccinationService;

	@GetMapping("/schedules")
	public List<ScheduleCalendarEntry> getSchedules(
		@RequestParam int year,
		@RequestParam int month
	) {
		Long userId = resolveUserId();
		return vaccinationService.getSchedules(userId, year, month);
	}

	@PostMapping("/schedules")
	@ResponseStatus(HttpStatus.CREATED)
	public void createSchedule(@RequestBody @Valid CreateScheduleRequest request) {
		Long userId = resolveUserId();
		vaccinationService.createSchedule(userId, request);
	}

	@GetMapping("/summary")
	public List<VaccinationPetSummaryResponse> getSummary() {
		Long userId = resolveUserId();
		return vaccinationService.getSummary(userId);
	}

	private Long resolveUserId() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null || !(authentication.getPrincipal() instanceof Long userId)) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
		}
		return userId;
	}
}
