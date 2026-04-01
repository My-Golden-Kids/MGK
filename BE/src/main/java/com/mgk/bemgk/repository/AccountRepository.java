package com.mgk.bemgk.repository;

import com.mgk.bemgk.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountRepository extends JpaRepository<Account, Long> {
}
