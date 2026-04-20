package com.mgk.bemgk.dto.feeding;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.mgk.bemgk.entity.FeedingSchedule;
import com.mgk.bemgk.entity.Pet;

class FeedingDtosTest {

	@Test
	void feedingScheduleDtosExposeFieldsAndMapping() {
		FeedingScheduleRequest request = new FeedingScheduleRequest();
		ReflectionTestUtils.setField(request, "firstFeedTime", LocalTime.of(7, 0));
		ReflectionTestUtils.setField(request, "mealsPerDay", 3);
		ReflectionTestUtils.setField(request, "customAmountG", 90);

		Pet pet = Pet.builder().name("돌멩이").build();
		ReflectionTestUtils.setField(pet, "id", 5L);

		FeedingSchedule schedule = FeedingSchedule.builder()
			.pet(pet)
			.firstFeedTime(LocalTime.of(7, 0))
			.mealsPerDay(3)
			.customAmountG(90)
			.build();

		FeedingScheduleResponse response = FeedingScheduleResponse.of(
			schedule,
			30,
			List.of(LocalTime.of(7, 0), LocalTime.of(13, 0), LocalTime.of(19, 0))
		);

		assertThat(request.getFirstFeedTime()).isEqualTo(LocalTime.of(7, 0));
		assertThat(request.getMealsPerDay()).isEqualTo(3);
		assertThat(request.getCustomAmountG()).isEqualTo(90);
		assertThat(response.getPetId()).isEqualTo(5L);
		assertThat(response.getPetName()).isEqualTo("돌멩이");
		assertThat(response.getFirstFeedTime()).isEqualTo(LocalTime.of(7, 0));
		assertThat(response.getMealsPerDay()).isEqualTo(3);
		assertThat(response.getCustomAmountG()).isEqualTo(90);
		assertThat(response.getPerMealAmountG()).isEqualTo(30);
		assertThat(response.getFeedTimes()).hasSize(3);
	}
}
