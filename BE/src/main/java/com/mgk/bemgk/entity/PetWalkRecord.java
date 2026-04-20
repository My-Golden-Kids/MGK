package com.mgk.bemgk.entity;

import java.time.LocalDateTime;

import com.mgk.bemgk.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(
	name = "pet_walk_records",
	uniqueConstraints = {
		@UniqueConstraint(
			name = "uk_pet_walk_record_pet_source",
			columnNames = {"pet_id", "source"})
	}
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PetWalkRecord extends BaseEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "pet_id", nullable = false)
	private Pet pet;

	@Column(nullable = false, length = 50)
	private String source;

	@Column(name = "walked_at", nullable = false)
	private LocalDateTime walkedAt;

	@Column(name = "step_count", nullable = false)
	private Integer stepCount;

	@Column(name = "walk_time_seconds", nullable = false)
	private Integer walkTimeSeconds;

	@Column(name = "distance_km", nullable = false)
	private Double distanceKm;

	@Column(name = "reward_amount", nullable = false)
	private Integer rewardAmount;

	@Column
	private Boolean completed;

	@Column(length = 20)
	private String status;

	@Column(name = "started_at")
	private LocalDateTime startedAt;

	@Column(name = "ended_at")
	private LocalDateTime endedAt;

	private PetWalkRecord(
		Pet pet,
		String source,
		LocalDateTime walkedAt,
		Integer stepCount,
		Integer walkTimeSeconds,
		Double distanceKm,
		Integer rewardAmount,
		Boolean completed,
		String status,
		LocalDateTime startedAt,
		LocalDateTime endedAt
	) {
		this.pet = pet;
		this.source = source;
		this.walkedAt = walkedAt;
		this.stepCount = stepCount;
		this.walkTimeSeconds = walkTimeSeconds;
		this.distanceKm = distanceKm;
		this.rewardAmount = rewardAmount;
		this.completed = completed;
		this.status = status;
		this.startedAt = startedAt;
		this.endedAt = endedAt;
	}

	public static PetWalkRecord create(
		Pet pet,
		String source,
		LocalDateTime walkedAt,
		Integer stepCount,
		Integer walkTimeSeconds,
		Double distanceKm
	) {
		int safeStepCount = stepCount == null ? 0 : stepCount;
		int safeWalkTimeSeconds = walkTimeSeconds == null ? 0 : walkTimeSeconds;
		double safeDistanceKm = distanceKm == null ? 0 : distanceKm;

		return new PetWalkRecord(
			pet,
			source,
			walkedAt == null ? LocalDateTime.now() : walkedAt,
			safeStepCount,
			safeWalkTimeSeconds,
			safeDistanceKm,
			safeStepCount / 3000,
			true,
			"COMPLETED",
			walkedAt == null ? LocalDateTime.now() : walkedAt,
			walkedAt == null ? LocalDateTime.now() : walkedAt
		);
	}

	public static PetWalkRecord createLive(
		Pet pet,
		String source,
		LocalDateTime walkedAt,
		Integer stepCount,
		Integer walkTimeSeconds,
		Double distanceKm,
		String status
	) {
		int safeStepCount = stepCount == null ? 0 : stepCount;
		int safeWalkTimeSeconds = walkTimeSeconds == null ? 0 : walkTimeSeconds;
		double safeDistanceKm = distanceKm == null ? 0 : distanceKm;

		return new PetWalkRecord(
			pet,
			source,
			walkedAt == null ? LocalDateTime.now() : walkedAt,
			safeStepCount,
			safeWalkTimeSeconds,
			safeDistanceKm,
			safeStepCount / 3000,
			false,
			status == null || status.isBlank() ? "WALKING" : status,
			walkedAt == null ? LocalDateTime.now() : walkedAt,
			null
		);
	}

	public int calculateNewStepCount(Integer currentStepCount) {
		int safeCurrentStepCount = currentStepCount == null ? 0 : currentStepCount;
		int safeStepCount = stepCount == null ? 0 : stepCount;

		return Math.max(0, safeCurrentStepCount - safeStepCount);
	}

	public int calculateNewWalkTimeSeconds(Integer currentWalkTimeSeconds) {
		int safeCurrentWalkTimeSeconds = currentWalkTimeSeconds == null ? 0 : currentWalkTimeSeconds;
		int safeWalkTimeSeconds = walkTimeSeconds == null ? 0 : walkTimeSeconds;

		return Math.max(0, safeCurrentWalkTimeSeconds - safeWalkTimeSeconds);
	}

	public void updateLive(
		LocalDateTime walkedAt,
		Integer currentStepCount,
		Integer currentWalkTimeSeconds,
		Double currentDistanceKm,
		String status
	) {
		int safeCurrentStepCount = currentStepCount == null ? 0 : currentStepCount;
		int safeCurrentWalkTimeSeconds = currentWalkTimeSeconds == null ? 0 : currentWalkTimeSeconds;
		double safeCurrentDistanceKm = currentDistanceKm == null ? 0 : currentDistanceKm;

		if (walkedAt != null && startedAt == null) {
			this.startedAt = walkedAt;
		}

		if (safeCurrentStepCount > (stepCount == null ? 0 : stepCount)) {
			this.stepCount = safeCurrentStepCount;
			this.rewardAmount = safeCurrentStepCount / 3000;
		}

		if (safeCurrentWalkTimeSeconds > (walkTimeSeconds == null ? 0 : walkTimeSeconds)) {
			this.walkTimeSeconds = safeCurrentWalkTimeSeconds;
		}

		if (safeCurrentDistanceKm > (distanceKm == null ? 0 : distanceKm)) {
			this.distanceKm = safeCurrentDistanceKm;
		}

		if (status != null && !status.isBlank()) {
			this.status = status;
		}
	}

	public boolean isCompleted() {
		return Boolean.TRUE.equals(completed);
	}

	public void markCompleted() {
		this.completed = true;
		this.status = "COMPLETED";
	}

	public void markCompleted(LocalDateTime endedAt) {
		this.endedAt = endedAt == null ? LocalDateTime.now() : endedAt;
		this.walkedAt = this.endedAt;
		markCompleted();
	}

	@PrePersist
	void onPrePersist() {
		LocalDateTime start = startedAt == null ? LocalDateTime.now() : startedAt;
		this.startedAt = start;
		setCreatedAt(start);
		setUpdatedAt(endedAt == null ? start : endedAt);
	}

	@PreUpdate
	void onPreUpdate() {
		setCreatedAt(startedAt == null ? getCreatedAt() : startedAt);

		if (endedAt != null) {
			setUpdatedAt(endedAt);
		}
	}
}
