package com.mgk.bemgk.entity;

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
import java.time.LocalDateTime;
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

    @Column(nullable = false, length = 100)
    private String species;

    @Column(nullable = false)
    private Integer age;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PetSize size;

    @Column(name = "walk_count", nullable = false)
    private Integer walkCount;

    @Column(name = "walk_time", nullable = false)
    private Integer walkTime;

    @Column(name = "last_walk_at")
    private LocalDateTime lastWalkAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "eat_meal", nullable = false, length = 10)
    private MealStatus eatMeal;

    @Builder
    public Pet(User user, String name, String species, Integer age, PetSize size,
               Integer walkCount, Integer walkTime, LocalDateTime lastWalkAt,
               MealStatus eatMeal) {
        this.user = user;
        this.name = name;
        this.species = species;
        this.age = age;
        this.size = size;
        this.walkCount = walkCount;
        this.walkTime = walkTime;
        this.lastWalkAt = lastWalkAt;
        this.eatMeal = eatMeal;
    }
}
