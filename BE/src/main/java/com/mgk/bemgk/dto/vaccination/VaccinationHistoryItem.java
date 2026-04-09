package com.mgk.bemgk.dto.vaccination;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class VaccinationHistoryItem {

    private String date;
    private boolean completed;
}
