package com.mgk.bemgk.dto.vaccination;

import java.util.List;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ScheduleCalendarEntry {

	private String date;           // YYYY-MM-DD
	private List<String> eventTypes; // e.g. ["VACCINATION", "CHECKUP"]
}
