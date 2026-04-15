package com.mgk.bemgk.entity;

import java.time.LocalTime;

import com.mgk.bemgk.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "feeding_schedules")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FeedingSchedule extends BaseEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "pet_id", nullable = false)
	private Pet pet;

	@Column(name = "first_feed_time", nullable = false)
	private LocalTime firstFeedTime;

	@Column(name = "meals_per_day", nullable = false)
	private Integer mealsPerDay;

	// null 이면 기본값(species + age) 계산, 직접 입력 시 해당 값 사용
	@Column(name = "custom_amount_g")
	private Integer customAmountG;

	@Builder
	public FeedingSchedule(Pet pet, LocalTime firstFeedTime, Integer mealsPerDay, Integer customAmountG) {
		this.pet = pet;
		this.firstFeedTime = firstFeedTime;
		this.mealsPerDay = mealsPerDay;
		this.customAmountG = customAmountG;
	}

	public void update(LocalTime firstFeedTime, Integer mealsPerDay, Integer customAmountG) {
		this.firstFeedTime = firstFeedTime;
		this.mealsPerDay = mealsPerDay;
		this.customAmountG = customAmountG;
	}
}
