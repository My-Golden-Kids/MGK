package com.mgk.bemgk.dto.alarm;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AlarmResponse {

    private Integer mostFrequentWalkHour;  // null이면 산책 기록 없음
    private List<TodayCalendarEventDto> todayEvents;
    private List<FeedingAlarmDto> feedingAlarms;
}
