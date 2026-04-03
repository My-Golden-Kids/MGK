package com.mgk.bemgk.repository;

import com.mgk.bemgk.entity.AccountBook;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AccountBookRepository extends JpaRepository<AccountBook, Long> {

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
