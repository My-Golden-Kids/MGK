package com.mgk.bemgk.dto.medical;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OcrResponseDto {

    private String date;
    private String time;
    private String type;
    private String petName;
    private String hospitalName;
    private String details;
    private Integer totalAmount;
    private String rawText;
}
