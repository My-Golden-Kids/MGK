package com.mgk.bemgk.entity;

import java.time.LocalDateTime;

import com.mgk.bemgk.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "pets")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Pet extends BaseEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Column(nullable = false, length = 100)
	private String name;

	@Column(length = 100)
	private String species;

	@Column(length = 2048)
	private String image;

	@Column
	private Double age;

	@Enumerated(EnumType.STRING)
	@Column(length = 20)
	private PetSize size;

	@Column(name = "walk_count")
	private Integer walkCount;

	@Column(name = "walk_time")
	private Integer walkTime;

	@Column(nullable = false)
	private Boolean death = false;

	@Column(name = "death_date")
	private LocalDateTime deathDate;

	@Column(name = "last_walk_at")
	private LocalDateTime lastWalkAt;

	@Enumerated(EnumType.STRING)
	@Column(name = "eat_meal", length = 10)
	private MealStatus eatMeal;

	@Builder
	public Pet(User user, String name, String species, String image, Double age, PetSize size,
		Integer walkCount, Integer walkTime, Boolean death,
		LocalDateTime deathDate, LocalDateTime lastWalkAt, MealStatus eatMeal) {
		this.user = user;
		this.name = name;
		this.species = species;
		this.image = image;
		this.age = age;
		this.size = size;
		this.walkCount = walkCount;
		this.walkTime = walkTime;
		this.death = death == null ? false : death;
		this.deathDate = deathDate;
		this.lastWalkAt = lastWalkAt;
		this.eatMeal = eatMeal;
	}

	public void update(String name, Double age, String species, PetSize size, String image, Boolean isDeath) {
		if (name != null && !name.isBlank()) {
			this.name = name.trim();
		}
		if (age != null) {
			this.age = age;
		}
		if (species != null) {
			this.species = species;
		}
		if (size != null) {
			this.size = size;
		}
		if (image != null) {
			this.image = image;
		}
		if (isDeath != null) {
			updateDeath(isDeath);
		}
	}

	public boolean isDead() {
		return Boolean.TRUE.equals(death);
	}

	private void updateDeath(Boolean isDeath) {
		boolean nextDeath = Boolean.TRUE.equals(isDeath);
		boolean wasDead = isDead();

		this.death = nextDeath;

		if (nextDeath && !wasDead) {
			this.deathDate = LocalDateTime.now();
			return;
		}

		if (!nextDeath) {
			this.deathDate = null;
		}
	}

	public void addWalkRecord(Integer stepCount, Integer walkTimeSeconds, LocalDateTime walkedAt) {
		int safeStepCount = stepCount == null ? 0 : stepCount;
		int safeWalkTimeSeconds = walkTimeSeconds == null ? 0 : walkTimeSeconds;

		this.walkCount = (this.walkCount == null ? 0 : this.walkCount) + safeStepCount;
		this.walkTime = (this.walkTime == null ? 0 : this.walkTime) + safeWalkTimeSeconds;
		this.lastWalkAt = walkedAt == null ? LocalDateTime.now() : walkedAt;
	}
}
