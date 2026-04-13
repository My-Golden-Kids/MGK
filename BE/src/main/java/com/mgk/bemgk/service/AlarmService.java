package com.mgk.bemgk.service;

import com.mgk.bemgk.dto.alarm.AlarmResponse;
import com.mgk.bemgk.dto.alarm.TodayCalendarEventDto;
import com.mgk.bemgk.entity.CalendarEvent;
import com.mgk.bemgk.entity.PetWalkRecord;
import com.mgk.bemgk.repository.CalendarRepository;
import com.mgk.bemgk.repository.PetWalkRecordRepository;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AlarmService {

    private final PetWalkRecordRepository petWalkRecordRepository;
    private final CalendarRepository calendarRepository;
    private final CurrentUserService currentUserService;

    public AlarmResponse getAlarms() {
        Long userId = currentUserService.getCurrentUserId();
        LocalDate today = LocalDate.now();

        Integer mostFrequentWalkHour = calculateMostFrequentWalkHour(userId);

        List<TodayCalendarEventDto> todayEvents = calendarRepository
                .findByPet_User_IdAndDateOrderByDate(userId, today)
                .stream()
                .map(TodayCalendarEventDto::from)
                .toList();

        return AlarmResponse.builder()
                .mostFrequentWalkHour(mostFrequentWalkHour)
                .todayEvents(todayEvents)
                .build();
    }

    private Integer calculateMostFrequentWalkHour(Long userId) {
        List<PetWalkRecord> records = petWalkRecordRepository
                .findAllByPet_User_IdAndCompletedTrue(userId);

        Map<Integer, Long> hourCounts = records.stream()
                .filter(r -> r.getWalkedAt() != null)
                .collect(Collectors.groupingBy(
                        r -> r.getWalkedAt().getHour(),
                        Collectors.counting()
                ));

        if (hourCounts.isEmpty()) {
            return null;
        }

        // 빈도 내림차순 → 같은 빈도면 시간 오름차순
        return hourCounts.entrySet().stream()
                .sorted(Map.Entry.<Integer, Long>comparingByValue().reversed()
                        .thenComparingInt(Map.Entry::getKey))
                .map(Map.Entry::getKey)
                .findFirst()
                .orElse(null);
    }
}
