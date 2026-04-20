package com.mgk.bemgk.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "average_medical_cost")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AverageMedicalCost {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String category;

	private String item;

	private String species; // DOG, CAT, ALL

	private String size; // SMALL, MEDIUM, LARGE, ALL

	@Column(name = "avg_cost")
	private Integer avgCost;

	@Builder
	public AverageMedicalCost(String category, String item, String species, String size, Integer avgCost) {
		this.category = category;
		this.item = item;
		this.species = species;
		this.size = size;
		this.avgCost = avgCost;
	}
}
