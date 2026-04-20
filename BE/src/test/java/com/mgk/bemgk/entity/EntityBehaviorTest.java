package com.mgk.bemgk.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class EntityBehaviorTest {

	@Test
	void accountAddsRewardAndTotalAmountSafely() {
		Account account = Account.builder()
			.moneyAmount(BigDecimal.valueOf(1000))
			.rewardAmount(BigDecimal.valueOf(10))
			.totalAmount(BigDecimal.valueOf(1010))
			.build();

		account.addRewardAmount(BigDecimal.valueOf(5));
		account.addRewardAmount(null);

		assertThat(account.getRewardAmount()).isEqualByComparingTo("15");
		assertThat(account.getTotalAmount()).isEqualByComparingTo("1015");
	}

	@Test
	void feedingScheduleUpdatesValues() {
		FeedingSchedule schedule = FeedingSchedule.builder()
			.firstFeedTime(java.time.LocalTime.of(8, 0))
			.mealsPerDay(2)
			.customAmountG(80)
			.build();

		schedule.update(java.time.LocalTime.of(9, 0), 3, 90);

		assertThat(schedule.getFirstFeedTime()).isEqualTo(java.time.LocalTime.of(9, 0));
		assertThat(schedule.getMealsPerDay()).isEqualTo(3);
		assertThat(schedule.getCustomAmountG()).isEqualTo(90);
	}

	@Test
	void refreshTokenDetectsExpiration() {
		RefreshToken expired = RefreshToken.builder()
			.token("expired")
			.expiresAt(LocalDateTime.now().minusMinutes(1))
			.build();
		RefreshToken valid = RefreshToken.builder()
			.token("valid")
			.expiresAt(LocalDateTime.now().plusMinutes(1))
			.build();

		assertThat(expired.isExpired()).isTrue();
		assertThat(valid.isExpired()).isFalse();
	}

	@Test
	void petUpdateAndWalkRecordAccumulateState() {
		Pet pet = Pet.builder()
			.name("멩이")
			.age(3.0)
			.species("DOG")
			.size(PetSize.중형)
			.walkCount(100)
			.walkTime(50)
			.death(false)
			.build();

		pet.update(" 돌멩이 ", 4.0, "CAT", PetSize.소형, "https://image", true);
		assertThat(pet.getName()).isEqualTo("돌멩이");
		assertThat(pet.getAge()).isEqualTo(4.0);
		assertThat(pet.getSpecies()).isEqualTo("CAT");
		assertThat(pet.getSize()).isEqualTo(PetSize.소형);
		assertThat(pet.isDead()).isTrue();
		assertThat(pet.getDeathDate()).isNotNull();

		pet.update(null, null, null, null, null, false);
		pet.addWalkRecord(300, 120, LocalDateTime.of(2026, 4, 16, 8, 0));

		assertThat(pet.isDead()).isFalse();
		assertThat(pet.getDeathDate()).isNull();
		assertThat(pet.getWalkCount()).isEqualTo(400);
		assertThat(pet.getWalkTime()).isEqualTo(170);
		assertThat(pet.getLastWalkAt()).isEqualTo(LocalDateTime.of(2026, 4, 16, 8, 0));
	}

	@Test
	void petWalkRecordCreatesUpdatesAndCompletes() {
		Pet pet = Pet.builder().name("멩이").build();
		ReflectionTestUtils.setField(pet, "id", 1L);

		PetWalkRecord completed = PetWalkRecord.create(
			pet,
			"APPLE_HEALTH",
			LocalDateTime.of(2026, 4, 16, 8, 0),
			6000,
			1800,
			2.4
		);
		PetWalkRecord live = PetWalkRecord.createLive(
			pet,
			"CORE_MOTION_1",
			LocalDateTime.of(2026, 4, 16, 9, 0),
			1000,
			300,
			0.8,
			null
		);

		assertThat(completed.isCompleted()).isTrue();
		assertThat(completed.getRewardAmount()).isEqualTo(2);
		assertThat(completed.calculateNewStepCount(6500)).isEqualTo(500);
		assertThat(completed.calculateNewWalkTimeSeconds(2000)).isEqualTo(200);

		live.updateLive(LocalDateTime.of(2026, 4, 16, 9, 10), 4000, 900, 1.5, "PAUSED");
		assertThat(live.getStepCount()).isEqualTo(4000);
		assertThat(live.getWalkTimeSeconds()).isEqualTo(900);
		assertThat(live.getDistanceKm()).isEqualTo(1.5);
		assertThat(live.getStatus()).isEqualTo("PAUSED");

		live.markCompleted(LocalDateTime.of(2026, 4, 16, 9, 30));
		live.onPrePersist();
		live.onPreUpdate();

		assertThat(live.isCompleted()).isTrue();
		assertThat(live.getStatus()).isEqualTo("COMPLETED");
		assertThat(live.getEndedAt()).isNotNull();
		assertThat(live.getUpdatedAt()).isNotNull();
	}

	@Test
	void simpleEntityBuildersExposeValues() {
		MapLocation mapLocation = MapLocation.builder()
			.name("동물병원")
			.latitude(BigDecimal.valueOf(37.5))
			.longitude(BigDecimal.valueOf(127.0))
			.category("Hospital")
			.build();
		Transaction transaction = Transaction.builder()
			.amount(BigDecimal.valueOf(10000))
			.type(TransactionType.OUT)
			.category("PET")
			.build();

		assertThat(mapLocation.getName()).isEqualTo("동물병원");
		assertThat(mapLocation.getCategory()).isEqualTo("Hospital");
		assertThat(transaction.getAmount()).isEqualByComparingTo("10000");
		assertThat(transaction.getType()).isEqualTo(TransactionType.OUT);
		assertThat(transaction.getCategory()).isEqualTo("PET");
	}
}
