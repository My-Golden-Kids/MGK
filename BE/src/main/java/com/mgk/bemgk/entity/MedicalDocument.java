package com.mgk.bemgk.entity;

import com.mgk.bemgk.common.CreatedAtEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "medical_documents")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MedicalDocument extends CreatedAtEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pet_id", nullable = false)
    private Pet pet;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false, length = 100)
    private String type;

    @Column(name = "hospital_name", length = 200)
    private String hospitalName;

    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    @Builder
    public MedicalDocument(Pet pet, String name, LocalDate date, String type,
                           String hospitalName, String imageUrl) {
        this.pet = pet;
        this.name = name;
        this.date = date;
        this.type = type;
        this.hospitalName = hospitalName;
        this.imageUrl = imageUrl;
    }
}
