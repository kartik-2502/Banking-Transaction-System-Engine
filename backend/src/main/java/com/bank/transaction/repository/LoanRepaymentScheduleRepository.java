package com.bank.transaction.repository;

import com.bank.transaction.model.LoanRepaymentSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanRepaymentScheduleRepository extends JpaRepository<LoanRepaymentSchedule, Long> {
    List<LoanRepaymentSchedule> findByLoanIdOrderByInstallmentNumberAsc(Long loanId);
    List<LoanRepaymentSchedule> findByLoanIdAndStatusOrderByInstallmentNumberAsc(Long loanId, String status);
}
