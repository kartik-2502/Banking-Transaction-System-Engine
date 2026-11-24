package com.bank.transaction.service;

import com.bank.transaction.dto.DepositRequest;
import com.bank.transaction.dto.LoanApplicationRequest;
import com.bank.transaction.dto.LoanResponse;
import com.bank.transaction.dto.LoanReviewRequest;
import com.bank.transaction.exception.AccountNotFoundException;
import com.bank.transaction.exception.CustomerNotFoundException;
import com.bank.transaction.exception.InvalidTransactionException;
import com.bank.transaction.model.*;
import com.bank.transaction.repository.AccountRepository;
import com.bank.transaction.repository.CustomerRepository;
import com.bank.transaction.repository.LoanRepository;
import com.bank.transaction.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LoanServiceImpl implements LoanService {

    private static final Logger log = LoggerFactory.getLogger(LoanServiceImpl.class);

    private final LoanRepository loanRepository;
    private final CustomerRepository customerRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final TransactionService transactionService;

    public LoanServiceImpl(LoanRepository loanRepository,
                           CustomerRepository customerRepository,
                           AccountRepository accountRepository,
                           UserRepository userRepository,
                           TransactionService transactionService) {
        this.loanRepository = loanRepository;
        this.customerRepository = customerRepository;
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
        this.transactionService = transactionService;
    }

    @Override
    @Transactional
    public LoanResponse applyForLoan(String username, LoanApplicationRequest request) {
        log.info("Processing loan application for user: {}, account: {}, amount: {}",
                username, request.getAccountNumber(), request.getAmount());

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new CustomerNotFoundException("User not found: " + username));

        Customer customer = customerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new CustomerNotFoundException("Customer profile not found for user: " + username));

        Account account = accountRepository.findByAccountNumber(request.getAccountNumber())
                .orElseThrow(() -> new AccountNotFoundException("Account not found: " + request.getAccountNumber()));

        if (!account.getCustomer().getId().equals(customer.getId())) {
            throw new InvalidTransactionException("Specified account does not belong to the applying customer");
        }

        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new InvalidTransactionException("Cannot apply for a loan on a non-active account (" + account.getStatus() + ")");
        }

        String loanId = "LN" + System.currentTimeMillis() + (int)(Math.random() * 900 + 100);
        BigDecimal defaultRate = new BigDecimal("8.50"); // Standard retail annual interest rate

        Loan loan = new Loan(
                loanId,
                customer,
                account,
                request.getAmount(),
                defaultRate,
                request.getTermMonths(),
                request.getPurpose()
        );

        Loan saved = loanRepository.save(loan);
        log.info("Loan application created [loanId={}, amount={}]", saved.getLoanId(), saved.getAmount());
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public LoanResponse reviewLoan(String loanId, String reviewedBy, LoanReviewRequest request) {
        log.info("Reviewing loan: {} by officer: {}, approved: {}", loanId, reviewedBy, request.isApproved());

        Loan loan = loanRepository.findByLoanId(loanId)
                .orElseThrow(() -> new InvalidTransactionException("Loan application not found: " + loanId));

        if (loan.getStatus() != LoanStatus.PENDING && loan.getStatus() != LoanStatus.UNDER_REVIEW) {
            throw new InvalidTransactionException("Loan is already in " + loan.getStatus() + " status and cannot be re-reviewed");
        }

        loan.setReviewedBy(reviewedBy);
        if (request.isApproved()) {
            loan.setStatus(LoanStatus.APPROVED);
            if (request.getInterestRate() != null && request.getInterestRate().compareTo(BigDecimal.ZERO) > 0) {
                loan.setInterestRate(request.getInterestRate());
            }
        } else {
            loan.setStatus(LoanStatus.REJECTED);
            loan.setRejectionReason(request.getRejectionReason() != null ? request.getRejectionReason() : "Did not meet underwriting criteria");
        }

        Loan updated = loanRepository.save(loan);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public LoanResponse disburseLoan(String loanId, String officerUsername) {
        log.info("Disbursing loan: {} by officer: {}", loanId, officerUsername);

        Loan loan = loanRepository.findByLoanId(loanId)
                .orElseThrow(() -> new InvalidTransactionException("Loan not found: " + loanId));

        if (loan.getStatus() != LoanStatus.APPROVED) {
            throw new InvalidTransactionException("Only APPROVED loans can be disbursed. Current status: " + loan.getStatus());
        }

        // Atomically deposit loan amount to recipient account via transaction engine
        String txnId = "TXN_DISBURSE_" + loan.getLoanId();
        DepositRequest depositRequest = new DepositRequest(
                txnId,
                loan.getAccount().getAccountNumber(),
                loan.getAmount(),
                "LOAN_OFFICER:" + officerUsername
        );
        transactionService.processDeposit(depositRequest);

        loan.setStatus(LoanStatus.DISBURSED);
        loan.setDisbursedAt(OffsetDateTime.now());
        Loan disbursed = loanRepository.save(loan);

        log.info("Loan disbursed successfully [loanId={}, amount={}, account={}]",
                loanId, loan.getAmount(), loan.getAccount().getAccountNumber());
        return mapToResponse(disbursed);
    }

    @Override
    @Transactional(readOnly = true)
    public LoanResponse getLoanById(String loanId) {
        return loanRepository.findByLoanId(loanId)
                .map(this::mapToResponse)
                .orElseThrow(() -> new InvalidTransactionException("Loan not found: " + loanId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LoanResponse> getLoans(LoanStatus status, Pageable pageable) {
        if (status != null) {
            return loanRepository.findByStatus(status, pageable).map(this::mapToResponse);
        }
        return loanRepository.findAll(pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LoanResponse> getCustomerLoans(Long customerId) {
        return loanRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private LoanResponse mapToResponse(Loan loan) {
        LoanResponse res = new LoanResponse();
        res.setId(loan.getId());
        res.setLoanId(loan.getLoanId());
        res.setCustomerId(loan.getCustomer().getId());
        res.setCustomerNumber(loan.getCustomer().getCustomerNumber());
        res.setAccountNumber(loan.getAccount().getAccountNumber());
        res.setAmount(loan.getAmount());
        res.setInterestRate(loan.getInterestRate());
        res.setTermMonths(loan.getTermMonths());
        res.setStatus(loan.getStatus());
        res.setPurpose(loan.getPurpose());
        res.setReviewedBy(loan.getReviewedBy());
        res.setRejectionReason(loan.getRejectionReason());
        res.setDisbursedAt(loan.getDisbursedAt());
        res.setCreatedAt(loan.getCreatedAt());
        return res;
    }
}
