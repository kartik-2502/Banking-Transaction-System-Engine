package com.bank.transaction;

import com.bank.transaction.dto.*;
import com.bank.transaction.exception.AccountFrozenException;
import com.bank.transaction.model.Account;
import com.bank.transaction.model.AccountStatus;
import com.bank.transaction.repository.AccountRepository;
import com.bank.transaction.service.AccountService;
import com.bank.transaction.service.TransactionService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class AccountFreezeAndRiskIntegrationTest {

    @Autowired
    private AccountService accountService;

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private AccountRepository accountRepository;

    @AfterEach
    void resetAccountState() {
        accountRepository.findByAccountNumber("ACC1001").ifPresent(acc -> {
            acc.setStatus(AccountStatus.ACTIVE);
            acc.setBalance(new BigDecimal("10000.00"));
            accountRepository.saveAndFlush(acc);
        });
        accountService.updateAccountLimits("ACC1001",
                new AccountTransactionLimitUpdateRequest(new BigDecimal("100000.00"), new BigDecimal("50000.00")),
                "cleanup");
    }

    @Test
    @DisplayName("Account Freeze lifecycle: Freeze blocks transactions, logs status change, and Unfreeze restores operations")
    void testAccountFreezeAndUnfreezeLifecycle() {
        // 1. Freeze account ACC1001
        AccountResponse frozenAcc = accountService.freezeAccount("ACC1001", "Suspicious cross-border burst", "kavya_nair");
        assertNotNull(frozenAcc);
        assertEquals(AccountStatus.FROZEN, frozenAcc.getStatus());

        // 2. Invariant: Transaction from frozen account must immediately throw AccountFrozenException
        String txnId = "TXN_FAIL_FROZEN_" + System.currentTimeMillis();
        WithdrawalRequest withdrawalReq = new WithdrawalRequest(txnId, "ACC1001", new BigDecimal("500.00"), "ATM");
        assertThrows(AccountFrozenException.class, () -> transactionService.processWithdrawal(withdrawalReq));

        // 3. Status change history audit verification
        List<AccountStatusHistoryResponse> history = accountService.getAccountStatusHistory("ACC1001");
        assertFalse(history.isEmpty());
        AccountStatusHistoryResponse latest = history.get(0);
        assertEquals(AccountStatus.FROZEN, latest.getNewStatus());
        assertEquals("kavya_nair", latest.getChangedBy());
        assertEquals("Suspicious cross-border burst", latest.getReason());

        // 4. Unfreeze account ACC1001
        AccountResponse unfrozenAcc = accountService.unfreezeAccount("ACC1001", "Customer identity successfully validated", "kavya_nair");
        assertEquals(AccountStatus.ACTIVE, unfrozenAcc.getStatus());

        // 5. Transaction must now succeed normally
        String txnSuccessId = "TXN_OK_UNFROZEN_" + System.currentTimeMillis();
        TransactionResponse successTxn = transactionService.processWithdrawal(
                new WithdrawalRequest(txnSuccessId, "ACC1001", new BigDecimal("500.00"), "ATM")
        );
        assertNotNull(successTxn);
        assertEquals("SUCCESS", successTxn.getStatus().name());
    }

    @Test
    @DisplayName("Risk Controls: Transaction limits update and risk profile inspection")
    void testTransactionLimitsAndRiskProfile() {
        // 1. Update limits to custom lower thresholds
        AccountTransactionLimitUpdateRequest limitReq = new AccountTransactionLimitUpdateRequest(
                new BigDecimal("25000.00"),
                new BigDecimal("5000.00")
        );
        AccountTransactionLimitResponse limitRes = accountService.updateAccountLimits("ACC1001", limitReq, "kavya_nair");
        assertEquals(new BigDecimal("5000.00"), limitRes.getPerTransactionLimit());
        assertEquals(new BigDecimal("25000.00"), limitRes.getDailyLimit());

        // 2. Fetch risk profile
        AccountRiskProfileResponse riskProfile = accountService.getAccountRiskProfile("ACC1001");
        assertNotNull(riskProfile);
        assertEquals("ACC1001", riskProfile.getAccountNumber());
        assertEquals(new BigDecimal("5000.00"), riskProfile.getPerTransactionLimit());
        assertNotNull(riskProfile.getRiskSummary());
    }
}
