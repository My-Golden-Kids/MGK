package com.mgk.bemgk.dto.pet;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.mgk.bemgk.entity.MealStatus;
import com.mgk.bemgk.entity.Pet;
import com.mgk.bemgk.entity.PetSize;
import com.mgk.bemgk.entity.PetWalkRecord;

class PetDtosTest {

	@Test
	void petAndWalkDtosExposeFieldsAndStaticMappings() {
		CreatePetRequest createPetRequest = new CreatePetRequest("멩이", "https://image", 3.0, "DOG", "중형", false);
		UpdatePetRequest updatePetRequest = new UpdatePetRequest("돌멩이", 4.0, "CAT", "소형", "https://new", true);

		Pet pet = Pet.builder()
			.name("멩이")
			.image("https://image")
			.age(3.0)
			.species("DOG")
			.size(PetSize.중형)
			.walkCount(4000)
			.walkTime(1800)
			.death(false)
			.lastWalkAt(LocalDateTime.of(2026, 4, 16, 8, 0))
			.eatMeal(MealStatus.YES)
			.build();
		ReflectionTestUtils.setField(pet, "id", 9L);

		PetResponse petResponse = PetResponse.from(pet);

		WalkDtos.SaveWalkRequest saveWalkRequest = new WalkDtos.SaveWalkRequest();
		ReflectionTestUtils.setField(saveWalkRequest, "stepCount", 5000);
		ReflectionTestUtils.setField(saveWalkRequest, "walkTimeSeconds", 1200);
		ReflectionTestUtils.setField(saveWalkRequest, "distanceKm", 2.5);
		ReflectionTestUtils.setField(saveWalkRequest, "walkedAt", OffsetDateTime.parse("2026-04-16T09:00:00+09:00"));
		ReflectionTestUtils.setField(saveWalkRequest, "source", "APPLE_HEALTH");
		ReflectionTestUtils.setField(saveWalkRequest, "completed", true);
		ReflectionTestUtils.setField(saveWalkRequest, "status", "COMPLETED");

		WalkDtos.WalkResponse walkResponse = WalkDtos.WalkResponse.of(
			pet,
			3000,
			7000,
			900,
			BigDecimal.valueOf(5)
		);

		PetWalkRecord liveRecord = PetWalkRecord.createLive(
			pet,
			"APPLE_HEALTH",
			LocalDateTime.of(2026, 4, 16, 9, 0),
			4500,
			1200,
			2.1,
			"WALKING"
		);
		ReflectionTestUtils.setField(liveRecord, "id", 20L);
		ReflectionTestUtils.setField(liveRecord, "createdAt", LocalDateTime.of(2026, 4, 16, 9, 0));

		WalkDtos.LiveWalkResponse liveWalkResponse = WalkDtos.LiveWalkResponse.from(liveRecord, BigDecimal.valueOf(7));
		WalkDtos.WalkRecordResponse walkRecordResponse = WalkDtos.WalkRecordResponse.from(liveRecord);

		assertThat(createPetRequest.name()).isEqualTo("멩이");
		assertThat(updatePetRequest.size()).isEqualTo("소형");
		assertThat(petResponse.getId()).isEqualTo(9L);
		assertThat(petResponse.getName()).isEqualTo("멩이");
		assertThat(petResponse.getSize()).isEqualTo("중형");
		assertThat(petResponse.getIsDeath()).isFalse();
		assertThat(saveWalkRequest.getStepCount()).isEqualTo(5000);
		assertThat(saveWalkRequest.getWalkTimeSeconds()).isEqualTo(1200);
		assertThat(saveWalkRequest.getDistanceKm()).isEqualTo(2.5);
		assertThat(saveWalkRequest.getSource()).isEqualTo("APPLE_HEALTH");
		assertThat(saveWalkRequest.getCompleted()).isTrue();
		assertThat(saveWalkRequest.getStatus()).isEqualTo("COMPLETED");
		assertThat(walkResponse.getPetId()).isEqualTo(9L);
		assertThat(walkResponse.getRewardAmount()).isEqualTo(1);
		assertThat(walkResponse.getTotalStepCount()).isEqualTo(4000);
		assertThat(liveWalkResponse.getPetId()).isEqualTo(9L);
		assertThat(liveWalkResponse.getStatus()).isEqualTo("WALKING");
		assertThat(liveWalkResponse.getTotalRewardAmount()).isEqualByComparingTo("7");
		assertThat(walkRecordResponse.getId()).isEqualTo(20L);
		assertThat(walkRecordResponse.getRewardAmount()).isEqualTo(liveRecord.getRewardAmount());
	}
}
