package com.mgk.bemgk.dto.feeding;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalTime;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class FeedingScheduleRequest {

    @NotNull(message = "첫 급여 시간은 필수입니다.")
    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime firstFeedTime;

    @NotNull(message = "하루 급여 횟수는 필수입니다.")
    @Min(value = 2, message = "하루 급여 횟수는 최소 2회입니다.")
    @Max(value = 4, message = "하루 급여 횟수는 최대 4회입니다.")
    private Integer mealsPerDay;

    // null 이면 기본값(species + age) 사용
    private Integer customAmountG;
}
