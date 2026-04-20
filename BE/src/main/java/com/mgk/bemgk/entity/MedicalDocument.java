package com.mgk.bemgk.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "medical_documents")
@Getter
@Setter
@NoArgsConstructor
public class MedicalDocument {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "pet_id", nullable = false)
	private Pet pet;

	@Column(nullable = false, length = 100)
	private String petName;

	private LocalDate date;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 50)
	private MedicalDocumentType type;

	@Column(nullable = false, length = 255)
	private String hospitalName;

	@Column(length = 2000)
	private String details;

	private Integer totalAmount;

	private String imageUrl;
	private LocalDateTime createdAt = LocalDateTime.now();
}
