package com.bank.transaction.repository;

import com.bank.transaction.model.LoanDocumentVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanDocumentVerificationRepository extends JpaRepository<LoanDocumentVerification, Long> {
    List<LoanDocumentVerification> findByDocumentIdOrderByVerifiedAtDesc(Long documentId);
    List<LoanDocumentVerification> findByLoanIdOrderByVerifiedAtDesc(Long loanId);
}
