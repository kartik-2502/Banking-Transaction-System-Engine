package com.bank.transaction.service;

import com.bank.transaction.dto.LoanApplicationRequest;
import com.bank.transaction.dto.LoanResponse;
import com.bank.transaction.dto.LoanReviewRequest;
import com.bank.transaction.model.LoanStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface LoanService {
    LoanResponse applyForLoan(String username, LoanApplicationRequest request);
    LoanResponse reviewLoan(String loanId, String reviewedBy, LoanReviewRequest request);
    LoanResponse disburseLoan(String loanId, String officerUsername);
    LoanResponse getLoanById(String loanId);
    Page<LoanResponse> getLoans(LoanStatus status, Pageable pageable);
    List<LoanResponse> getCustomerLoans(Long customerId);
}
