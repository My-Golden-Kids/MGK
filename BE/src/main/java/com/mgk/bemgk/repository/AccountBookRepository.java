package com.mgk.bemgk.repository;

import com.mgk.bemgk.entity.AccountBook;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AccountBookRepository extends JpaRepository<AccountBook, Long> {

    @Modifying
    @Query("""
            update AccountBook a
            set a.pet = null
            where a.pet.id = :petId
            """)
    void clearPetByPetId(@Param("petId") Long petId);

    @Query("""
            select coalesce(sum(a.amount), 0)
            from AccountBook a
            where a.user.id = :userId
              and a.pet is not null
            """)
    BigDecimal sumPetExpenseByUserId(@Param("userId") Long userId);

    @Query("""
            select min(a.spendDate)
            from AccountBook a
            where a.user.id = :userId
              and a.pet is not null
            """)
    LocalDate findFirstPetSpendDateByUserId(@Param("userId") Long userId);

    @Query("""
            select coalesce(sum(a.amount), 0)
            from AccountBook a
            where a.user.id = :userId
              and a.pet is not null
              and a.spendDate >= :startDate
            """)
    BigDecimal sumPetExpenseLastYear(
        @Param("userId") Long userId,
        @Param("startDate") LocalDate startDate
    );

    @Query("""
            select year(a.spendDate), month(a.spendDate), coalesce(sum(a.amount), 0)
            from AccountBook a
            where a.user.id = :userId
              and a.pet is not null
              and a.spendDate between :startDate and :endDate
            group by year(a.spendDate), month(a.spendDate)
            order by year(a.spendDate), month(a.spendDate)
            """)
    List<Object[]> sumMonthlyPetExpenseByUserId(
        @Param("userId") Long userId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Query("""
            select a
            from AccountBook a
            where a.user.id = :userId
              and a.spendDate between :startDateTime and :endDateTime
            order by a.spendDate desc, a.id desc
            """)
    List<AccountBook> findMonthlyExpensesByUserId(
            @Param("userId") Long userId,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime
    );

    @Query("""
            select coalesce(sum(a.amount), 0)
            from AccountBook a
            where a.user.id = :userId
              and a.spendDate between :startDateTime and :endDateTime
            """)
    BigDecimal sumAmountByUserIdAndSpendDateTimeBetween(
            @Param("userId") Long userId,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime
    );

    @Query("""
            select coalesce(sum(a.amount), 0)
            from AccountBook a
            where a.user.id = :userId
              and a.category in :categories
              and a.spendDate between :startDate and :endDate
            """)
    BigDecimal sumAmountByUserIdAndCategoriesAndSpendDateBetween(
            @Param("userId") Long userId,
            @Param("categories") List<String> categories,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("""
            select count(a)
            from AccountBook a
            where a.user.id = :userId
              and a.category = :category
              and a.spendDate between :startDate and :endDate
            """)
    Long countByUserIdAndCategoryAndSpendDateBetween(
            @Param("userId") Long userId,
            @Param("category") String category,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
