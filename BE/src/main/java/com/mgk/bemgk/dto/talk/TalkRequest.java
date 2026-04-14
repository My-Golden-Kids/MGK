package com.mgk.bemgk.dto.talk;

import jakarta.validation.constraints.NotBlank;

public record TalkRequest(
        @NotBlank(message = "transcript는 비어 있을 수 없습니다.")
        String transcript,
        Long petId
) {
}
