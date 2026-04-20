package com.mgk.bemgk.common;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;

class CommonEntitiesTest {

	@Test
	void baseEntityProtectedSettersExposeTimestamps() {
		TestBaseEntity entity = new TestBaseEntity();
		LocalDateTime createdAt = LocalDateTime.of(2026, 4, 16, 10, 0);
		LocalDateTime updatedAt = createdAt.plusHours(1);

		entity.changeTimestamps(createdAt, updatedAt);

		assertThat(entity.getCreatedAt()).isEqualTo(createdAt);
		assertThat(entity.getUpdatedAt()).isEqualTo(updatedAt);
	}

	@Test
	void createdAtEntityGetterReturnsAssignedValue() {
		TestCreatedAtEntity entity = new TestCreatedAtEntity();
		LocalDateTime createdAt = LocalDateTime.of(2026, 4, 16, 10, 0);

		entity.changeCreatedAt(createdAt);

		assertThat(entity.getCreatedAt()).isEqualTo(createdAt);
	}

	private static final class TestBaseEntity extends BaseEntity {
		private void changeTimestamps(LocalDateTime createdAt, LocalDateTime updatedAt) {
			setCreatedAt(createdAt);
			setUpdatedAt(updatedAt);
		}
	}

	private static final class TestCreatedAtEntity extends CreatedAtEntity {
		private void changeCreatedAt(LocalDateTime createdAt) {
			org.springframework.test.util.ReflectionTestUtils.setField(this, "createdAt", createdAt);
		}
	}
}
