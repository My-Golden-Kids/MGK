package com.mgk.bemgk.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.mgk.bemgk.dto.feeding.FeedingScheduleRequest;
import com.mgk.bemgk.dto.feeding.FeedingScheduleResponse;
import com.mgk.bemgk.service.FeedingScheduleService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/feeding-schedules")
@RequiredArgsConstructor
public class FeedingScheduleController {

	private final FeedingScheduleService feedingScheduleService;

	// 현재 유저의 모든 펫 급여 스케줄 조회
	@GetMapping
	public List<FeedingScheduleResponse> getSchedules() {
		return feedingScheduleService.getSchedules();
	}

	// 특정 펫 급여 스케줄 조회
	@GetMapping("/{petId}")
	public FeedingScheduleResponse getSchedule(@PathVariable Long petId) {
		return feedingScheduleService.getSchedule(petId);
	}

	// 특정 펫 급여 스케줄 등록
	@PostMapping("/{petId}")
	@ResponseStatus(HttpStatus.CREATED)
	public FeedingScheduleResponse createSchedule(
		@PathVariable Long petId,
		@Valid @RequestBody FeedingScheduleRequest request) {
		return feedingScheduleService.createSchedule(petId, request);
	}

	// 특정 펫 급여 스케줄 수정
	@PutMapping("/{petId}")
	public FeedingScheduleResponse updateSchedule(
		@PathVariable Long petId,
		@Valid @RequestBody FeedingScheduleRequest request) {
		return feedingScheduleService.updateSchedule(petId, request);
	}

	// 특정 펫 급여 스케줄 삭제
	@DeleteMapping("/{petId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteSchedule(@PathVariable Long petId) {
		feedingScheduleService.deleteSchedule(petId);
	}
}
