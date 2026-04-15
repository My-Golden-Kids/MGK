package com.mgk.bemgk.dto.feeding;

import java.time.LocalTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.mgk.bemgk.entity.FeedingSchedule;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FeedingScheduleResponse {

	private Long petId;
	private String petName;
	@JsonFormat(pattern = "HH:mm:ss")
	private LocalTime firstFeedTime;
	private Integer mealsPerDay;
	private Integer customAmountG;     // null 이면 기본값 사용 중
	private Integer perMealAmountG;    // 실제 1회 급여량 (custom or 계산값)
	@JsonFormat(pattern = "HH:mm:ss")
	private List<LocalTime> feedTimes; // 계산된 급여 시간 목록

	public static FeedingScheduleResponse of(FeedingSchedule schedule, int perMealAmountG, List<LocalTime> feedTimes) {
		return FeedingScheduleResponse.builder()
			.petId(schedule.getPet().getId())
			.petName(schedule.getPet().getName())
			.firstFeedTime(schedule.getFirstFeedTime())
			.mealsPerDay(schedule.getMealsPerDay())
			.customAmountG(schedule.getCustomAmountG())
			.perMealAmountG(perMealAmountG)
			.feedTimes(feedTimes)
			.build();
	}
}
