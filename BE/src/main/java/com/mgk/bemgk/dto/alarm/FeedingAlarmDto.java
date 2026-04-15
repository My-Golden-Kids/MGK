package com.mgk.bemgk.dto.alarm;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FeedingAlarmDto {

    private Long petId;
    private String petName;
    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime feedTime;
    private Integer amountGram; // null 이면 species/age 정보 부족으로 계산 불가 → 프론트에서 g 표시 생략
}
