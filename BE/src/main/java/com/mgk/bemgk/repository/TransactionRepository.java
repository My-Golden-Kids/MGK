package com.mgk.bemgk.repository;

import com.mgk.bemgk.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
}
