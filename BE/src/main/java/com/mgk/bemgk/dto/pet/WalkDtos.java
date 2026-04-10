package com.mgk.bemgk.dto.pet;

import com.mgk.bemgk.entity.Pet;
import com.mgk.bemgk.entity.PetWalkRecord;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Getter;

public final class WalkDtos {

    private static final int STEP_REWARD_UNIT = 3000;

    private WalkDtos() {
    }

    @Getter
    public static class SaveWalkRequest {

        @NotNull
        @Min(0)
        private Integer stepCount;

        @Min(0)
        private Integer walkTimeSeconds;

        @Min(0)
        private Double distanceKm;

        private OffsetDateTime walkedAt;

        private String source;

        private Boolean completed;

        private String status;
    }

    @Getter
    @Builder
    public static class WalkResponse {

        private Long petId;
        private Integer savedStepCount;
        private Integer syncedTotalStepCount;
        private Integer savedWalkTimeSeconds;
        private Integer rewardAmount;
        private Integer totalStepCount;
        private Integer totalWalkTimeSeconds;
        private BigDecimal totalRewardAmount;
        private LocalDateTime lastWalkAt;

        public static WalkResponse of(
                Pet pet,
                Integer savedStepCount,
                Integer syncedTotalStepCount,
                Integer savedWalkTimeSeconds,
                BigDecimal totalRewardAmount
        ) {
            int safeSavedStepCount = savedStepCount == null ? 0 : savedStepCount;
            int safeSavedWalkTimeSeconds = savedWalkTimeSeconds == null ? 0 : savedWalkTimeSeconds;
            int totalStepCount = pet.getWalkCount() == null ? 0 : pet.getWalkCount();

            return WalkResponse.builder()
                    .petId(pet.getId())
                    .savedStepCount(safeSavedStepCount)
                    .syncedTotalStepCount(syncedTotalStepCount)
                    .savedWalkTimeSeconds(safeSavedWalkTimeSeconds)
                    .rewardAmount(safeSavedStepCount / STEP_REWARD_UNIT)
                    .totalStepCount(totalStepCount)
                    .totalWalkTimeSeconds(pet.getWalkTime())
                    .totalRewardAmount(totalRewardAmount)
                    .lastWalkAt(pet.getLastWalkAt())
                    .build();
        }
    }

    @Getter
    @Builder
    public static class LiveWalkResponse {

        private Long petId;
        private String source;
        private Integer stepCount;
        private Integer walkTimeSeconds;
        private Double distanceKm;
        private Boolean completed;
        private String status;
        private BigDecimal totalRewardAmount;
        private LocalDateTime updatedAt;

        public static LiveWalkResponse from(PetWalkRecord record, BigDecimal totalRewardAmount) {
            return LiveWalkResponse.builder()
                    .petId(record.getPet().getId())
                    .source(record.getSource())
                    .stepCount(record.getStepCount())
                    .walkTimeSeconds(record.getWalkTimeSeconds())
                    .distanceKm(record.getDistanceKm())
                    .completed(record.isCompleted())
                    .status(record.getStatus())
                    .totalRewardAmount(totalRewardAmount)
                    .updatedAt(record.getUpdatedAt())
                    .build();
        }
    }

    @Getter
    @Builder
    public static class WalkRecordResponse {

        private Long id;
        private Long petId;
        private LocalDateTime walkedAt;
        private LocalDateTime createdAt;
        private Integer stepCount;
        private Integer walkTimeSeconds;
        private Double distanceKm;
        private Integer rewardAmount;

        public static WalkRecordResponse from(PetWalkRecord record) {
            return WalkRecordResponse.builder()
                    .id(record.getId())
                    .petId(record.getPet().getId())
                    .walkedAt(record.getWalkedAt())
                    .createdAt(record.getCreatedAt())
                    .stepCount(record.getStepCount())
                    .walkTimeSeconds(record.getWalkTimeSeconds())
                    .distanceKm(record.getDistanceKm())
                    .rewardAmount(record.getRewardAmount())
                    .build();
        }
    }
}
