package com.bank.transaction.repository;

import com.bank.transaction.model.LoanRepaymentSchedule;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

@Repository
public interface LoanRepaymentScheduleRepository extends JpaRepository<LoanRepaymentSchedule, Long> {
    List<LoanRepaymentSchedule> findByLoanIdOrderByInstallmentNumberAsc(Long loanId);
    List<LoanRepaymentSchedule> findByLoanIdAndStatusOrderByInstallmentNumberAsc(Long loanId, String status);

    @Query("SELECT s FROM LoanRepaymentSchedule s JOIN FETCH s.loan l JOIN FETCH l.customer c WHERE s.status IN :statuses ORDER BY s.dueDate ASC")
    List<LoanRepaymentSchedule> findByStatusesWithLoan(@Param("statuses") Collection<String> statuses);

    @Query("SELECT s FROM LoanRepaymentSchedule s JOIN s.loan l WHERE s.status IN :statuses AND s.dueDate < :cutoff ORDER BY s.dueDate ASC")
    Page<LoanRepaymentSchedule> findOverdueSchedules(@Param("statuses") Collection<String> statuses,
                                                     @Param("cutoff") LocalDate cutoff,
                                                     Pageable pageable);
}
