package com.mgk.bemgk.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mgk.bemgk.dto.alarm.AlarmResponse;
import com.mgk.bemgk.service.AlarmService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/alarm")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class AlarmController {

	private final AlarmService alarmService;

	@GetMapping
	public AlarmResponse getAlarms() {
		return alarmService.getAlarms();
	}
}
