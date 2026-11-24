package com.bank.transaction;

import com.bank.transaction.concurrency.ConcurrentTransactionExecutor;
import com.bank.transaction.dto.DepositRequest;
import com.bank.transaction.dto.TransactionResponse;
import com.bank.transaction.dto.TransferRequest;
import com.bank.transaction.dto.WithdrawalRequest;
import com.bank.transaction.exception.InsufficientBalanceException;
import com.bank.transaction.model.Account;
import com.bank.transaction.repository.AccountRepository;
import com.bank.transaction.service.TransactionService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.RepeatedTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class ConcurrencyAndIdempotencyIntegrationTest {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private ConcurrentTransactionExecutor executor;

    @AfterEach
    void resetSeedBalances() {
        accountRepository.findByAccountNumber("ACC1001").ifPresent(a -> {
            a.setBalance(new BigDecimal("10000.00"));
            accountRepository.saveAndFlush(a);
        });
        accountRepository.findByAccountNumber("ACC2004").ifPresent(a -> {
            a.setBalance(new BigDecimal("25000.00"));
            accountRepository.saveAndFlush(a);
        });
        accountRepository.findByAccountNumber("ACC3005").ifPresent(a -> {
            a.setBalance(new BigDecimal("5000.00"));
            accountRepository.saveAndFlush(a);
        });
    }

    /**
     * MANDATORY CONCURRENCY SPECIFICATION TEST:
     * Initial balance = ₹10,000.00.
     * Simultaneous requests:
     * - Thread A withdraws ₹7,000.00
     * - Thread B withdraws ₹5,000.00
     *
     * Invariants to prove:
     * 1. Both withdrawals must NEVER succeed.
     * 2. Exactly one withdrawal succeeds.
     * 3. Final balance must NEVER become negative.
     *
     * Repeated multiple times to aggressively expose any potential race condition.
     */
    @RepeatedTest(5)
    @DisplayName("Mandatory Concurrency: Simultaneous ₹7,000 and ₹5,000 withdrawals on ₹10,000 balance")
    void testMandatoryConcurrencyScenario() throws InterruptedException, ExecutionException {
        // Reset ACC1001 balance to exactly ₹10,000.00
        Account acc = accountRepository.findByAccountNumber("ACC1001").orElseThrow();
        acc.setBalance(new BigDecimal("10000.00"));
        accountRepository.saveAndFlush(acc);

        CountDownLatch startSignal = new CountDownLatch(1);
        CountDownLatch doneSignal = new CountDownLatch(2);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        String txnA = "TXN_CONC_A_" + System.currentTimeMillis() + "_" + ThreadLocalRandom.current().nextInt(1000);
        String txnB = "TXN_CONC_B_" + System.currentTimeMillis() + "_" + ThreadLocalRandom.current().nextInt(1000);

        Callable<TransactionResponse> taskA = () -> {
            startSignal.await();
            try {
                TransactionResponse res = transactionService.processWithdrawal(
                        new WithdrawalRequest(txnA, "ACC1001", new BigDecimal("7000.00"), "THREAD_A")
                );
                successCount.incrementAndGet();
                return res;
            } catch (InsufficientBalanceException ex) {
                failureCount.incrementAndGet();
                return null;
            } finally {
                doneSignal.countDown();
            }
        };

        Callable<TransactionResponse> taskB = () -> {
            startSignal.await();
            try {
                TransactionResponse res = transactionService.processWithdrawal(
                        new WithdrawalRequest(txnB, "ACC1001", new BigDecimal("5000.00"), "THREAD_B")
                );
                successCount.incrementAndGet();
                return res;
            } catch (InsufficientBalanceException ex) {
                failureCount.incrementAndGet();
                return null;
            } finally {
                doneSignal.countDown();
            }
        };

        Future<TransactionResponse> futureA = executor.submit(taskA);
        Future<TransactionResponse> futureB = executor.submit(taskB);

        // Release both threads simultaneously
        startSignal.countDown();
        doneSignal.await(5, TimeUnit.SECONDS);

        futureA.get();
        futureB.get();

        // INVARIANT CHECKS:
        assertEquals(1, successCount.get(), "Exactly one withdrawal must succeed");
        assertEquals(1, failureCount.get(), "Exactly one withdrawal must fail with insufficient balance");

        Account finalAcc = accountRepository.findByAccountNumber("ACC1001").orElseThrow();
        BigDecimal finalBalance = finalAcc.getBalance();

        assertTrue(finalBalance.compareTo(BigDecimal.ZERO) >= 0,
                "Final balance must NEVER become negative: " + finalBalance);

        // If Thread A won (withdrew 7,000), balance is 3,000. If Thread B won (withdrew 5,000), balance is 5,000.
        boolean validBalance = finalBalance.compareTo(new BigDecimal("3000.00")) == 0
                || finalBalance.compareTo(new BigDecimal("5000.00")) == 0;
        assertTrue(validBalance, "Final balance must be either ₹3,000 or ₹5,000, but was: " + finalBalance);
    }

    @Test
    @DisplayName("Concurrent Deposits: 10 threads depositing ₹1,000 simultaneously produce no lost updates")
    void testConcurrentDepositsNoLostUpdates() throws InterruptedException {
        Account acc = accountRepository.findByAccountNumber("ACC2004").orElseThrow();
        BigDecimal initialBalance = acc.getBalance();

        int threadCount = 10;
        BigDecimal depositPerThread = new BigDecimal("1000.00");
        CountDownLatch startSignal = new CountDownLatch(1);
        CountDownLatch doneSignal = new CountDownLatch(threadCount);

        List<Callable<TransactionResponse>> tasks = new ArrayList<>();
        for (int i = 0; i < threadCount; i++) {
            final int idx = i;
            tasks.add(() -> {
                startSignal.await();
                try {
                    String txnId = "TXN_CONC_DEP_" + System.currentTimeMillis() + "_" + idx;
                    return transactionService.processDeposit(
                            new DepositRequest(txnId, "ACC2004", depositPerThread, "THREAD_" + idx)
                    );
                } finally {
                    doneSignal.countDown();
                }
            });
        }

        tasks.forEach(executor::submit);
        startSignal.countDown();
        doneSignal.await(10, TimeUnit.SECONDS);

        Account finalAcc = accountRepository.findByAccountNumber("ACC2004").orElseThrow();
        BigDecimal expectedBalance = initialBalance.add(depositPerThread.multiply(BigDecimal.valueOf(threadCount)));
        assertEquals(expectedBalance, finalAcc.getBalance(), "Every concurrent deposit must be reflected without lost updates");
    }

    @Test
    @DisplayName("Deadlock-Free Concurrent Cross-Transfers: Simultaneous bi-directional transfers across shared accounts")
    void testDeadlockFreeConcurrentTransfers() throws InterruptedException {
        // ACC1001 and ACC2004 have sufficient balance
        Account a1 = accountRepository.findByAccountNumber("ACC1001").orElseThrow();
        a1.setBalance(new BigDecimal("20000.00"));
        accountRepository.saveAndFlush(a1);

        Account a2 = accountRepository.findByAccountNumber("ACC2004").orElseThrow();
        a2.setBalance(new BigDecimal("20000.00"));
        accountRepository.saveAndFlush(a2);

        int count = 10;
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(count);
        AtomicInteger successfulTransfers = new AtomicInteger(0);

        for (int i = 0; i < count; i++) {
            final int index = i;
            executor.submit(() -> {
                startLatch.await();
                try {
                    String txnId = "TXN_CROSS_" + System.currentTimeMillis() + "_" + index;
                    // Alternating transfer directions: Evokes classic deadlock scenario if locking is non-deterministic
                    if (index % 2 == 0) {
                        transactionService.processTransfer(
                                new TransferRequest(txnId, "ACC1001", "ACC2004", new BigDecimal("100.00"), "CROSS_1")
                        );
                    } else {
                        transactionService.processTransfer(
                                new TransferRequest(txnId, "ACC2004", "ACC1001", new BigDecimal("100.00"), "CROSS_2")
                        );
                    }
                    successfulTransfers.incrementAndGet();
                } catch (Exception ex) {
                    // Fail count will be reflected in assertion below
                } finally {
                    doneLatch.countDown();
                }
                return null;
            });
        }

        startLatch.countDown();
        boolean completedInTime = doneLatch.await(15, TimeUnit.SECONDS);

        assertTrue(completedInTime, "All cross-transfers must complete without deadlocking");
        assertEquals(count, successfulTransfers.get(), "All bi-directional transfers must succeed safely");
    }

    @Test
    @DisplayName("Idempotency: Repeated identical transactionId produces zero duplicate balance update")
    void testIdempotentTransactionRequests() {
        Account acc = accountRepository.findByAccountNumber("ACC3005").orElseThrow();
        BigDecimal initialBalance = acc.getBalance();

        String fixedTxnId = "TXN_IDEMPOTENCY_TEST_" + System.currentTimeMillis();
        DepositRequest req1 = new DepositRequest(fixedTxnId, "ACC3005", new BigDecimal("500.00"), "PORTAL");

        // First call
        TransactionResponse res1 = transactionService.processDeposit(req1);
        assertNotNull(res1);
        assertEquals(fixedTxnId, res1.getTransactionId());

        Account afterFirst = accountRepository.findByAccountNumber("ACC3005").orElseThrow();
        assertEquals(initialBalance.add(new BigDecimal("500.00")), afterFirst.getBalance());

        // Repeated second call with identical transaction ID
        DepositRequest req2 = new DepositRequest(fixedTxnId, "ACC3005", new BigDecimal("500.00"), "PORTAL");
        TransactionResponse res2 = transactionService.processDeposit(req2);
        assertNotNull(res2);
        assertEquals(fixedTxnId, res2.getTransactionId());

        // Crucial invariant: Balance must NOT change on repeated call
        Account afterSecond = accountRepository.findByAccountNumber("ACC3005").orElseThrow();
        assertEquals(afterFirst.getBalance(), afterSecond.getBalance(),
                "Duplicate request must produce zero duplicate financial impact");
    }

    @Test
    @DisplayName("Idempotency Under Concurrency: Simultaneous duplicate requests return original receipt safely")
    void testConcurrentDuplicateRequests() throws InterruptedException {
        Account acc = accountRepository.findByAccountNumber("ACC3005").orElseThrow();
        BigDecimal initialBalance = acc.getBalance();

        String fixedTxnId = "TXN_CONC_DUP_" + System.currentTimeMillis();
        int attempts = 5;
        CountDownLatch startSignal = new CountDownLatch(1);
        CountDownLatch doneSignal = new CountDownLatch(attempts);

        for (int i = 0; i < attempts; i++) {
            executor.submit(() -> {
                startSignal.await();
                try {
                    return transactionService.processDeposit(
                            new DepositRequest(fixedTxnId, "ACC3005", new BigDecimal("300.00"), "CONCURRENT_USER")
                    );
                } finally {
                    doneSignal.countDown();
                }
            });
        }

        startSignal.countDown();
        doneSignal.await(5, TimeUnit.SECONDS);

        // Assert balance increased by ONLY ONE single 300.00, NOT 5 x 300.00
        Account finalAcc = accountRepository.findByAccountNumber("ACC3005").orElseThrow();
        assertEquals(initialBalance.add(new BigDecimal("300.00")), finalAcc.getBalance(),
                "Only one balance update can occur even under concurrent duplicate submissions");
    }
}
