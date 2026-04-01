package com.mgk.bemgk.dto.medical;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MedicalDocumentCountResponse {

    private Long petId;
    private String type;
    private String name;
    private Long count;
}
