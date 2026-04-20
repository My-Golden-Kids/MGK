package com.mgk.bemgk.dto.alarm;

import com.mgk.bemgk.entity.CalendarEvent;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TodayCalendarEventDto {

	private Long petId;
	private String petName;
	private String name;
	private String eventType;

	public static TodayCalendarEventDto from(CalendarEvent event) {
		return TodayCalendarEventDto.builder()
			.petId(event.getPet().getId())
			.petName(event.getPet().getName())
			.name(event.getName())
			.eventType(event.getEventType())
			.build();
	}
}
