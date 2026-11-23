package com.bank.transaction.repository;

import com.bank.transaction.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByCustomerNumber(String customerNumber);
    Optional<Customer> findByEmail(String email);
    Optional<Customer> findByUserId(Long userId);
    boolean existsByCustomerNumber(String customerNumber);
    boolean existsByEmail(String email);

    @Query("SELECT c FROM Customer c LEFT JOIN FETCH c.accounts WHERE c.id = :id")
    Optional<Customer> findByIdWithAccounts(@Param("id") Long id);

    @Query("SELECT c FROM Customer c LEFT JOIN FETCH c.accounts WHERE c.customerNumber = :customerNumber")
    Optional<Customer> findByCustomerNumberWithAccounts(@Param("customerNumber") String customerNumber);
}
