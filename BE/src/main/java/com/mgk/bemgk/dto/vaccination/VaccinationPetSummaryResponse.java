package com.mgk.bemgk.dto.vaccination;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class VaccinationPetSummaryResponse {

    private Long petId;
    private String petName;
    private String petImageUrl;
    private String latestScheduleLabel;
    private List<VaccinationItemResponse> vaccinationItems;
}
