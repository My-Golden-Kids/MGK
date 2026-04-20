package com.mgk.bemgk.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mgk.bemgk.entity.Transaction;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
}
