package com.bank.transaction.service;

import com.bank.transaction.dto.*;
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

    AccountResponse freezeAccount(String accountNumber, String reason, String changedBy);
    AccountResponse unfreezeAccount(String accountNumber, String reason, String changedBy);
    AccountTransactionLimitResponse updateAccountLimits(String accountNumber, AccountTransactionLimitUpdateRequest request, String updatedBy);
    AccountTransactionLimitResponse getAccountLimits(String accountNumber);
    AccountRiskProfileResponse getAccountRiskProfile(String accountNumber);
}
