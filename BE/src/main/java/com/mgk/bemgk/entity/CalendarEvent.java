package com.mgk.bemgk.entity;

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
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "calendars")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CalendarEvent extends BaseEntity {

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

    @Column(length = 1000)
    private String memo;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Builder
    public CalendarEvent(Pet pet, String name, LocalDate date, String memo, String eventType) {
        this.pet = pet;
        this.name = name;
        this.date = date;
        this.memo = memo;
        this.eventType = eventType;
    }
}
