package com.bank.transaction.service;

import com.bank.transaction.dto.AccountCreateRequest;
import com.bank.transaction.dto.AccountResponse;
import com.bank.transaction.dto.AccountStatusHistoryResponse;
import com.bank.transaction.dto.AccountStatusUpdateRequest;
import com.bank.transaction.exception.AccountNotFoundException;
import com.bank.transaction.exception.CustomerNotFoundException;
import com.bank.transaction.exception.InvalidAccountException;
import com.bank.transaction.model.*;
import com.bank.transaction.repository.AccountRepository;
import com.bank.transaction.repository.AccountStatusHistoryRepository;
import com.bank.transaction.repository.AccountTransactionLimitRepository;
import com.bank.transaction.repository.CustomerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AccountServiceImpl implements AccountService {

    private static final Logger log = LoggerFactory.getLogger(AccountServiceImpl.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final AccountTransactionLimitRepository limitRepository;
    private final AccountStatusHistoryRepository statusHistoryRepository;

    public AccountServiceImpl(AccountRepository accountRepository,
                              CustomerRepository customerRepository,
                              AccountTransactionLimitRepository limitRepository,
                              AccountStatusHistoryRepository statusHistoryRepository) {
        this.accountRepository = accountRepository;
        this.customerRepository = customerRepository;
        this.limitRepository = limitRepository;
        this.statusHistoryRepository = statusHistoryRepository;
    }

    @Override
    public AccountResponse createAccount(AccountCreateRequest request) {
        log.info("Creating bank account for customer: {}", request.getCustomerNumber());

        Customer customer = customerRepository.findByCustomerNumber(request.getCustomerNumber())
                .orElseThrow(() -> new CustomerNotFoundException("Customer not found with number: " + request.getCustomerNumber()));

        if (request.getInitialBalance() != null && request.getInitialBalance().compareTo(BigDecimal.ZERO) < 0) {
            throw new InvalidAccountException("Initial balance cannot be negative");
        }

        String accountNumber = generateUniqueAccountNumber();
        Account account = new Account(
                accountNumber,
                customer,
                request.getInitialBalance(),
                request.getCurrency() != null ? request.getCurrency() : "INR"
        );

        Account savedAccount = accountRepository.save(account);

        // Configure default or requested transaction limits
        AccountTransactionLimit limit = new AccountTransactionLimit(
                savedAccount,
                request.getDailyLimit(),
                request.getPerTransactionLimit()
        );
        limitRepository.save(limit);

        // Record initial status creation history
        AccountStatusHistory history = new AccountStatusHistory(
                savedAccount,
                AccountStatus.ACTIVE,
                AccountStatus.ACTIVE,
                "Initial account opening with opening balance " + savedAccount.getBalance(),
                "SYSTEM"
        );
        statusHistoryRepository.save(history);

        log.info("Account created successfully: AccountNumber={}, CustomerNumber={}, Balance={}",
                savedAccount.getAccountNumber(), customer.getCustomerNumber(), savedAccount.getBalance());

        return mapToResponse(savedAccount, limit);
    }

    @Override
    @Transactional(readOnly = true)
    public AccountResponse getAccountByAccountNumber(String accountNumber) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new AccountNotFoundException("Account not found with number: " + accountNumber));
        AccountTransactionLimit limit = limitRepository.findByAccountId(account.getId()).orElse(null);
        return mapToResponse(account, limit);
    }

    @Override
    @Transactional(readOnly = true)
    public AccountResponse getAccountById(Long id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new AccountNotFoundException("Account not found with ID: " + id));
        AccountTransactionLimit limit = limitRepository.findByAccountId(account.getId()).orElse(null);
        return mapToResponse(account, limit);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AccountResponse> getAllAccounts(AccountStatus status, Pageable pageable) {
        Page<Account> accounts;
        if (status != null) {
            accounts = accountRepository.findAll(pageable); // Can be filtered
        } else {
            accounts = accountRepository.findAll(pageable);
        }
        return accounts.map(account -> {
            AccountTransactionLimit limit = limitRepository.findByAccountId(account.getId()).orElse(null);
            return mapToResponse(account, limit);
        });
    }

    @Override
    public AccountResponse updateAccountStatus(String accountNumber, AccountStatusUpdateRequest request) {
        log.info("Updating account status for {}: newStatus={}, reason={}", accountNumber, request.getStatus(), request.getReason());
        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new AccountNotFoundException("Account not found with number: " + accountNumber));

        AccountStatus previousStatus = account.getStatus();
        if (previousStatus == request.getStatus()) {
            throw new InvalidAccountException("Account is already in status " + previousStatus);
        }

        account.setStatus(request.getStatus());
        Account updatedAccount = accountRepository.save(account);

        // Record in status change history
        AccountStatusHistory history = new AccountStatusHistory(
                updatedAccount,
                previousStatus,
                request.getStatus(),
                request.getReason(),
                request.getChangedBy() != null ? request.getChangedBy() : "ADMIN"
        );
        statusHistoryRepository.save(history);

        AccountTransactionLimit limit = limitRepository.findByAccountId(updatedAccount.getId()).orElse(null);
        return mapToResponse(updatedAccount, limit);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AccountStatusHistoryResponse> getAccountStatusHistory(String accountNumber) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new AccountNotFoundException("Account not found with number: " + accountNumber));

        List<AccountStatusHistory> historyList = statusHistoryRepository.findByAccountIdOrderByCreatedAtDesc(account.getId());
        return historyList.stream()
                .map(h -> {
                    AccountStatusHistoryResponse res = new AccountStatusHistoryResponse();
                    res.setId(h.getId());
                    res.setAccountNumber(account.getAccountNumber());
                    res.setPreviousStatus(h.getPreviousStatus());
                    res.setNewStatus(h.getNewStatus());
                    res.setReason(h.getReason());
                    res.setChangedBy(h.getChangedBy());
                    res.setCreatedAt(h.getCreatedAt());
                    return res;
                })
                .collect(Collectors.toList());
    }

    private String generateUniqueAccountNumber() {
        String accountNumber;
        do {
            int randomNum = 1000 + RANDOM.nextInt(9000);
            accountNumber = "ACC" + randomNum;
        } while (accountRepository.existsByAccountNumber(accountNumber));
        return accountNumber;
    }

    private AccountResponse mapToResponse(Account account, AccountTransactionLimit limit) {
        AccountResponse response = new AccountResponse();
        response.setId(account.getId());
        response.setAccountNumber(account.getAccountNumber());
        if (account.getCustomer() != null) {
            response.setCustomerNumber(account.getCustomer().getCustomerNumber());
            response.setCustomerName(account.getCustomer().getFirstName() + " " + account.getCustomer().getLastName());
        }
        response.setBalance(account.getBalance());
        response.setCurrency(account.getCurrency());
        response.setStatus(account.getStatus());
        response.setVersion(account.getVersion());
        response.setCreatedAt(account.getCreatedAt());

        if (limit != null) {
            response.setDailyLimit(limit.getDailyLimit());
            response.setPerTransactionLimit(limit.getPerTransactionLimit());
        }
        return response;
    }
}
