package com.bank.transaction.benchmark;

import com.bank.transaction.dto.DepositRequest;
import com.bank.transaction.dto.TransactionResponse;
import com.bank.transaction.dto.TransferRequest;
import com.bank.transaction.dto.WithdrawalRequest;
import com.bank.transaction.exception.InsufficientBalanceException;
import com.bank.transaction.model.Account;
import com.bank.transaction.model.Customer;
import com.bank.transaction.model.TransactionStatus;
import com.bank.transaction.repository.AccountRepository;
import com.bank.transaction.repository.CustomerRepository;
import com.bank.transaction.service.TransactionService;
import org.junit.jupiter.api.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.LongAdder;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Milestone 15: High-Concurrency Performance Benchmark Test Suite.
 *
 * Evaluates:
 * 1. Multi-threaded throughput (TPS) across 1, 5, 10, and 20 worker threads.
 * 2. Latency percentiles: min, p50 (median), p95, p99, and max.
 * 3. Deadlock prevention under bidirectional concurrent transfers (ordered pessimistic locking).
 * 4. ACID Conservation of Money invariant (total balance before = total balance after).
 * 5. Strict Idempotency under concurrent burst replay.
 */
@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class HighConcurrencyBenchmarkTest {

    private static final Logger log = LoggerFactory.getLogger(HighConcurrencyBenchmarkTest.class);

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private final List<String> benchmarkAccountNumbers = new ArrayList<>();
    private static final int NUM_BENCHMARK_ACCOUNTS = 20;

    @BeforeAll
    void setupBenchmarkAccounts() {
        Customer defaultCustomer = customerRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("Seeded customer required for benchmark"));

        for (int i = 1; i <= NUM_BENCHMARK_ACCOUNTS; i++) {
            String accNum = String.format("ACC_BM_%03d", i);
            benchmarkAccountNumbers.add(accNum);
            if (accountRepository.findByAccountNumber(accNum).isEmpty()) {
                Account acc = new Account(accNum, defaultCustomer, new BigDecimal("100000.00"), "USD");
                accountRepository.saveAndFlush(acc);
            }
        }
    }

    @BeforeEach
    void resetBalances() {
        for (String accNum : benchmarkAccountNumbers) {
            setAccountBalance(accNum, new BigDecimal("100000.00"));
        }
    }

    private void setAccountBalance(String accountNumber, BigDecimal balance) {
        accountRepository.findByAccountNumber(accountNumber).ifPresent(acc -> {
            acc.setBalance(balance);
            accountRepository.saveAndFlush(acc);
        });
    }

    private BigDecimal getAccountBalance(String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber)
                .map(Account::getBalance)
                .orElse(BigDecimal.ZERO);
    }

    public static class BenchmarkResult {
        public final int threads;
        public final int totalTransactions;
        public final int successfulTransactions;
        public final int failedTransactions;
        public final double totalDurationSeconds;
        public final double throughputTps;
        public final long minLatencyMs;
        public final long p50LatencyMs;
        public final long p95LatencyMs;
        public final long p99LatencyMs;
        public final long maxLatencyMs;

        public BenchmarkResult(int threads, int totalTransactions, int successfulTransactions, int failedTransactions,
                               double totalDurationSeconds, double throughputTps,
                               long minLatencyMs, long p50LatencyMs, long p95LatencyMs, long p99LatencyMs, long maxLatencyMs) {
            this.threads = threads;
            this.totalTransactions = totalTransactions;
            this.successfulTransactions = successfulTransactions;
            this.failedTransactions = failedTransactions;
            this.totalDurationSeconds = totalDurationSeconds;
            this.throughputTps = throughputTps;
            this.minLatencyMs = minLatencyMs;
            this.p50LatencyMs = p50LatencyMs;
            this.p95LatencyMs = p95LatencyMs;
            this.p99LatencyMs = p99LatencyMs;
            this.maxLatencyMs = maxLatencyMs;
        }

        public void printSummary() {
            log.info("=========================================================================================");
            log.info(String.format(" BENCHMARK REPORT: Concurrency = %2d Threads | Target Volume = %d", threads, totalTransactions));
            log.info("=========================================================================================");
            log.info(String.format(" Duration:             %.3f seconds", totalDurationSeconds));
            log.info(String.format(" Successful Txns:      %d / %d (%.2f%%)", successfulTransactions, totalTransactions, (successfulTransactions * 100.0 / totalTransactions)));
            log.info(String.format(" Failed / Throttled:   %d", failedTransactions));
            log.info(String.format(" Throughput (TPS):     %.2f trans/sec", throughputTps));
            log.info(String.format(" Latency (min / p50):  %d ms / %d ms", minLatencyMs, p50LatencyMs));
            log.info(String.format(" Latency (p95 / p99):  %d ms / %d ms", p95LatencyMs, p99LatencyMs));
            log.info(String.format(" Latency (max):        %d ms", maxLatencyMs));
            log.info("=========================================================================================");
        }
    }

    private BenchmarkResult runBenchmark(int threadCount, int totalTxns) throws InterruptedException {
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch endGate = new CountDownLatch(totalTxns);

        LongAdder successCount = new LongAdder();
        LongAdder failureCount = new LongAdder();
        List<Long> latencies = new CopyOnWriteArrayList<>();

        int numAccs = benchmarkAccountNumbers.size();

        for (int i = 0; i < totalTxns; i++) {
            final int index = i;
            executor.submit(() -> {
                try {
                    startGate.await();
                    long t0 = System.nanoTime();

                    String txnId = "BM_" + threadCount + "T_" + System.currentTimeMillis() + "_" + index;
                    int type = index % 3;

                    int accIdx1 = (index * 7) % numAccs;
                    int accIdx2 = (index * 7 + 1) % numAccs;
                    String acc1 = benchmarkAccountNumbers.get(accIdx1);
                    String acc2 = benchmarkAccountNumbers.get(accIdx2);

                    if (type == 0) {
                        // Deposit
                        transactionService.processDeposit(new DepositRequest(txnId, acc1, new BigDecimal("10.00"), "BENCHMARK"));
                    } else if (type == 1) {
                        // Withdrawal
                        transactionService.processWithdrawal(new WithdrawalRequest(txnId, acc1, new BigDecimal("5.00"), "BENCHMARK"));
                    } else {
                        // Transfer
                        transactionService.processTransfer(new TransferRequest(txnId, acc1, acc2, new BigDecimal("2.50"), "BENCHMARK"));
                    }

                    long elapsedMs = (System.nanoTime() - t0) / 1_000_000L;
                    latencies.add(elapsedMs);
                    successCount.increment();
                } catch (InsufficientBalanceException ex) {
                    failureCount.increment();
                } catch (Exception ex) {
                    log.error("Benchmark transaction failed: {}", ex.getMessage());
                    failureCount.increment();
                } finally {
                    endGate.countDown();
                }
            });
        }

        long wallClockStart = System.currentTimeMillis();
        startGate.countDown();
        boolean completed = endGate.await(60, TimeUnit.SECONDS);
        long wallClockEnd = System.currentTimeMillis();

        executor.shutdown();
        assertTrue(completed, "Benchmark execution timed out before processing all transactions");

        double totalDurationSec = (wallClockEnd - wallClockStart) / 1000.0;
        double tps = totalTxns / (totalDurationSec > 0 ? totalDurationSec : 1.0);

        List<Long> sorted = latencies.stream().sorted().collect(Collectors.toList());
        long min = sorted.isEmpty() ? 0 : sorted.get(0);
        long max = sorted.isEmpty() ? 0 : sorted.get(sorted.size() - 1);
        long p50 = sorted.isEmpty() ? 0 : sorted.get((int) (sorted.size() * 0.50));
        long p95 = sorted.isEmpty() ? 0 : sorted.get((int) (sorted.size() * 0.95));
        long p99 = sorted.isEmpty() ? 0 : sorted.get((int) (sorted.size() * 0.99));

        BenchmarkResult result = new BenchmarkResult(
                threadCount, totalTxns, successCount.intValue(), failureCount.intValue(),
                totalDurationSec, tps, min, p50, p95, p99, max
        );
        result.printSummary();
        return result;
    }

    @Test
    @Order(1)
    @DisplayName("Benchmark 1: Single-Thread Baseline Performance (1 Thread, 50 Transactions)")
    void testSingleThreadBaseline() throws InterruptedException {
        BenchmarkResult res = runBenchmark(1, 50);
        assertEquals(50, res.successfulTransactions, "All single-threaded transactions should succeed");
        assertTrue(res.throughputTps > 0);
    }

    @Test
    @Order(2)
    @DisplayName("Benchmark 2: Moderate Concurrency Scaling (5 Threads, 100 Transactions)")
    void testModerateConcurrency() throws InterruptedException {
        BenchmarkResult res = runBenchmark(5, 100);
        assertTrue(res.successfulTransactions >= 95, "High success rate expected under 5-thread load");
    }

    @Test
    @Order(3)
    @DisplayName("Benchmark 3: High Concurrency Throughput (10 Threads, 200 Transactions)")
    void testHighConcurrency() throws InterruptedException {
        BenchmarkResult res = runBenchmark(10, 200);
        assertTrue(res.successfulTransactions >= 190, "High success rate expected under 10-thread load");
    }

    @Test
    @Order(4)
    @DisplayName("Benchmark 4: Peak Thread Pool Saturation (20 Threads, 300 Transactions)")
    void testPeakSaturationConcurrency() throws InterruptedException {
        BenchmarkResult res = runBenchmark(20, 300);
        assertTrue(res.successfulTransactions >= 285, "High success rate expected under 20-thread peak load");
    }

    @Test
    @Order(5)
    @DisplayName("Deadlock Prevention: Simultaneous Bidirectional Cross-Transfers on Identical Account Pair")
    void testDeadlockPreventionOnSharedAccounts() throws InterruptedException {
        String accA = benchmarkAccountNumbers.get(0);
        String accB = benchmarkAccountNumbers.get(1);

        int crossTransferCount = 100;
        ExecutorService executor = Executors.newFixedThreadPool(10);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch endGate = new CountDownLatch(crossTransferCount);

        AtomicInteger successCount = new AtomicInteger();
        AtomicInteger failureCount = new AtomicInteger();

        for (int i = 0; i < crossTransferCount; i++) {
            final int idx = i;
            executor.submit(() -> {
                try {
                    startGate.await();
                    String txnId = "DEADLOCK_TEST_" + System.currentTimeMillis() + "_" + idx;
                    if (idx % 2 == 0) {
                        transactionService.processTransfer(new TransferRequest(txnId, accA, accB, new BigDecimal("10.00"), "CROSS_TEST"));
                    } else {
                        transactionService.processTransfer(new TransferRequest(txnId, accB, accA, new BigDecimal("10.00"), "CROSS_TEST"));
                    }
                    successCount.incrementAndGet();
                } catch (Exception ex) {
                    failureCount.incrementAndGet();
                } finally {
                    endGate.countDown();
                }
            });
        }

        startGate.countDown();
        boolean completed = endGate.await(30, TimeUnit.SECONDS);
        executor.shutdown();

        assertTrue(completed, "Cross-transfers timed out, indicating potential deadlock");
        assertEquals(0, failureCount.get(), "Zero failures or deadlocks allowed in cross-transfer");
        assertEquals(crossTransferCount, successCount.get());
    }

    @Test
    @Order(6)
    @DisplayName("ACID Invariant Verification: Cross-Account Transfers Must Conserve Total System Balance")
    void testBalanceConservationInvariant() throws InterruptedException {
        BigDecimal initialSum = BigDecimal.ZERO;
        for (String accNum : benchmarkAccountNumbers) {
            initialSum = initialSum.add(getAccountBalance(accNum));
        }

        int transferCount = 150;
        ExecutorService executor = Executors.newFixedThreadPool(10);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch endGate = new CountDownLatch(transferCount);

        for (int i = 0; i < transferCount; i++) {
            final int idx = i;
            executor.submit(() -> {
                try {
                    startGate.await();
                    String src = benchmarkAccountNumbers.get(idx % benchmarkAccountNumbers.size());
                    String dst = benchmarkAccountNumbers.get((idx + 3) % benchmarkAccountNumbers.size());
                    String txnId = "INVARIANT_TRF_" + System.currentTimeMillis() + "_" + idx;
                    transactionService.processTransfer(new TransferRequest(txnId, src, dst, new BigDecimal("15.00"), "INVARIANT_TEST"));
                } catch (Exception ex) {
                    log.warn("Transfer error: {}", ex.getMessage());
                } finally {
                    endGate.countDown();
                }
            });
        }

        startGate.countDown();
        boolean completed = endGate.await(30, TimeUnit.SECONDS);
        executor.shutdown();

        assertTrue(completed);

        BigDecimal finalSum = BigDecimal.ZERO;
        for (String accNum : benchmarkAccountNumbers) {
            BigDecimal b = getAccountBalance(accNum);
            assertTrue(b.compareTo(BigDecimal.ZERO) >= 0, "No account balance can ever be negative");
            finalSum = finalSum.add(b);
        }

        // Conservation of money: total balance must remain invariant
        assertEquals(0, initialSum.compareTo(finalSum),
                String.format("ACID Violation! Total balance diverged: initial=%s, final=%s", initialSum, finalSum));
    }

    @Test
    @Order(7)
    @DisplayName("Idempotency Under Concurrent Storm: 10 Threads Submitting Identical Transaction ID")
    void testIdempotencyUnderConcurrentStorm() throws InterruptedException {
        String testAcc = benchmarkAccountNumbers.get(0);
        String commonTxnId = "STORM_IDEMPOTENT_" + System.currentTimeMillis();
        int stormThreads = 10;
        ExecutorService executor = Executors.newFixedThreadPool(stormThreads);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch endGate = new CountDownLatch(stormThreads);

        AtomicInteger successCount = new AtomicInteger();
        List<TransactionResponse> responses = new CopyOnWriteArrayList<>();

        BigDecimal initialBal = getAccountBalance(testAcc);

        for (int i = 0; i < stormThreads; i++) {
            executor.submit(() -> {
                try {
                    startGate.await();
                    TransactionResponse resp = transactionService.processDeposit(
                            new DepositRequest(commonTxnId, testAcc, new BigDecimal("500.00"), "STORM_TEST")
                    );
                    if (resp.getStatus() == TransactionStatus.SUCCESS) {
                        successCount.incrementAndGet();
                        responses.add(resp);
                    }
                } catch (Exception ex) {
                    log.warn("Storm thread caught: {}", ex.getMessage());
                } finally {
                    endGate.countDown();
                }
            });
        }

        startGate.countDown();
        endGate.await(20, TimeUnit.SECONDS);
        executor.shutdown();

        // Exactly one deposit of $500 must have been credited
        BigDecimal finalBal = getAccountBalance(testAcc);
        assertEquals(initialBal.add(new BigDecimal("500.00")), finalBal,
                "Balance must be incremented by exactly one deposit despite 10 concurrent requests");

        // Every thread that received a response saw the exact same transaction ID and amount
        assertFalse(responses.isEmpty());
        for (TransactionResponse r : responses) {
            assertEquals(commonTxnId, r.getTransactionId());
        }
    }

    @AfterAll
    void cleanupBenchmarkData() {
        try {
            jdbcTemplate.execute("DELETE FROM notification_outbox WHERE event_type LIKE 'TRANSACTION_%'");
            jdbcTemplate.execute("DELETE FROM fraud_alerts WHERE transaction_id LIKE 'BM_%' OR transaction_id LIKE 'DEADLOCK_%' OR transaction_id LIKE 'INVARIANT_%' OR transaction_id LIKE 'STORM_%'");
            jdbcTemplate.execute("DELETE FROM risk_assessments WHERE transaction_id LIKE 'BM_%' OR transaction_id LIKE 'DEADLOCK_%' OR transaction_id LIKE 'INVARIANT_%' OR transaction_id LIKE 'STORM_%'");
            jdbcTemplate.execute("DELETE FROM transactions WHERE transaction_id LIKE 'BM_%' OR transaction_id LIKE 'DEADLOCK_%' OR transaction_id LIKE 'INVARIANT_%' OR transaction_id LIKE 'STORM_%'");
        } catch (Exception ex) {
            log.warn("Benchmark cleanup exception: {}", ex.getMessage());
        }
    }
}
