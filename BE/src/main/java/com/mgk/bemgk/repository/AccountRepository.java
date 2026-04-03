package com.mgk.bemgk.repository;

import com.mgk.bemgk.entity.Account;
import java.math.BigDecimal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AccountRepository extends JpaRepository<Account, Long> {

    @Query("""
            select coalesce(sum(a.moneyAmount), 0)
            from Account a
            where a.user.id = :userId
            """)
    BigDecimal sumMoneyAmountByUserId(@Param("userId") Long userId);
}
