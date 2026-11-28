package com.bank.transaction.service;

import com.bank.transaction.dto.*;
import com.bank.transaction.model.LoanStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface LoanService {
    LoanResponse applyForLoan(String username, LoanApplicationRequest request);
    LoanResponse reviewLoan(String loanId, String reviewedBy, boolean isAdmin, LoanReviewRequest request);
    LoanResponse disburseLoan(String loanId, String officerUsername);
    LoanResponse repayInstallment(String loanId, String actorUsername, LoanRepaymentRequest request);
    LoanResponse getLoanById(String loanId);
    Page<LoanResponse> getLoans(LoanStatus status, String searchTerm, Pageable pageable);
    List<LoanResponse> getCustomerLoans(Long customerId);
    List<LoanResponse> getMyLoans(String username);
    LoanOfficerDashboardStats getDashboardStats();
    List<LoanRepaymentScheduleResponse> getRepaymentSchedule(String loanId);
    List<LoanStatusHistoryResponse> getLoanStatusHistory(String loanId);
    LoanEligibilityAssessmentResponse assessEligibility(BigDecimal monthlyIncome, BigDecimal existingDebt,
                                                        BigDecimal amount, Integer termMonths, Integer creditScore);
}
