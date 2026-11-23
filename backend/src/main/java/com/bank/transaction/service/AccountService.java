package com.bank.transaction.service;

import com.bank.transaction.dto.AccountCreateRequest;
import com.bank.transaction.dto.AccountResponse;
import com.bank.transaction.dto.AccountStatusHistoryResponse;
import com.bank.transaction.dto.AccountStatusUpdateRequest;
import com.bank.transaction.model.AccountStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AccountService {
    AccountResponse createAccount(AccountCreateRequest request);
    AccountResponse getAccountByAccountNumber(String accountNumber);
    AccountResponse getAccountById(Long id);
    Page<AccountResponse> getAllAccounts(AccountStatus status, Pageable pageable);
    AccountResponse updateAccountStatus(String accountNumber, AccountStatusUpdateRequest request);
    List<AccountStatusHistoryResponse> getAccountStatusHistory(String accountNumber);
}
