package com.bank.transaction;

import com.bank.transaction.model.*;
import com.bank.transaction.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class SchemaAndRepositoryIntegrationTest {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private AccountTransactionLimitRepository limitRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("Verify Flyway migrations created all core tables and constraints")
    void testFlywaySchemaTablesExist() {
        List<String> requiredTables = List.of(
            "roles", "users", "user_roles", "customers", "accounts",
            "account_status_history", "account_transaction_limits",
            "transactions", "transaction_audit", "failed_transactions",
            "risk_assessments", "fraud_alerts", "notifications", "notification_outbox"
        );

        for (String table : requiredTables) {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ?",
                Integer.class, table
            );
            assertNotNull(count, "Table check returned null for: " + table);
            assertEquals(1, count, "Required table missing in database: " + table);
        }
    }

    @Test
    @DisplayName("Verify initial seed data populated by migration V2")
    void testSeedDataPopulation() {
        // Roles check
        assertEquals(7, roleRepository.count(), "All 7 banking roles must be seeded");
        assertTrue(roleRepository.findByName(RoleName.ADMIN).isPresent());
        assertTrue(roleRepository.findByName(RoleName.CUSTOMER).isPresent());
        assertTrue(roleRepository.findByName(RoleName.TELLER).isPresent());
        assertTrue(roleRepository.findByName(RoleName.RISK_ANALYST).isPresent());
        assertTrue(roleRepository.findByName(RoleName.LOAN_OFFICER).isPresent());
        assertTrue(roleRepository.findByName(RoleName.BANK_MANAGER).isPresent());
        assertTrue(roleRepository.findByName(RoleName.AUDITOR).isPresent());

        // Users check
        assertTrue(userRepository.findByUsername("system_administrator").isPresent());
        assertTrue(userRepository.findByUsername("aarav_sharma").isPresent());

        // Mandatory Concurrency Account check
        Optional<Account> acc1001Opt = accountRepository.findByAccountNumber("ACC1001");
        assertTrue(acc1001Opt.isPresent(), "Mandatory concurrency test account ACC1001 must exist");
        Account acc1001 = acc1001Opt.get();
        assertEquals(new BigDecimal("10000.00"), acc1001.getBalance(), "ACC1001 must have initial balance of exactly ₹10,000.00");
        assertEquals(AccountStatus.ACTIVE, acc1001.getStatus());

        // Frozen Account check
        Optional<Account> acc9999Opt = accountRepository.findByAccountNumber("ACC9999");
        assertTrue(acc9999Opt.isPresent());
        assertEquals(AccountStatus.FROZEN, acc9999Opt.get().getStatus());

        // Transaction Limit check
        Optional<AccountTransactionLimit> limitOpt = limitRepository.findByAccountId(acc1001.getId());
        assertTrue(limitOpt.isPresent(), "Transaction limits must be configured for ACC1001");
        assertEquals(new BigDecimal("100000.00"), limitOpt.get().getDailyLimit());
    }

    @Test
    @Transactional
    @DisplayName("Verify Pessimistic Write Lock query executes without syntax errors")
    void testPessimisticLockQuery() {
        Optional<Account> lockedAccount = accountRepository.findByAccountNumberWithPessimisticLock("ACC1001");
        assertTrue(lockedAccount.isPresent());
        assertEquals("ACC1001", lockedAccount.get().getAccountNumber());
        assertNotNull(lockedAccount.get().getCustomer());
    }

    @Test
    @DisplayName("Verify Database Check Constraint: Account balance cannot be negative")
    void testBalanceNonNegativeConstraint() {
        // Direct SQL update attempting to bypass application layer and violate chk_account_balance_non_negative
        assertThrows(DataIntegrityViolationException.class, () -> {
            jdbcTemplate.update("UPDATE accounts SET balance = -500.00 WHERE account_number = 'ACC1001'");
        }, "Database must enforce CHECK (balance >= 0.00) and reject negative balance");
    }

    @Test
    @DisplayName("Verify Database Unique Constraint: Duplicate transaction_id is rejected")
    void testTransactionIdUniqueConstraint() {
        String testTxnId = "TXN_SEED_DUP_TEST";
        jdbcTemplate.update(
            "INSERT INTO transactions (transaction_id, type, amount, status) VALUES (?, 'DEPOSIT', 500.00, 'SUCCESS')",
            testTxnId
        );

        // Attempt duplicate insert
        assertThrows(DataIntegrityViolationException.class, () -> {
            jdbcTemplate.update(
                "INSERT INTO transactions (transaction_id, type, amount, status) VALUES (?, 'WITHDRAWAL', 200.00, 'SUCCESS')",
                testTxnId
            );
        }, "Database must enforce UNIQUE constraint on transaction_id");

        // Clean up test transaction
        jdbcTemplate.update("DELETE FROM transactions WHERE transaction_id = ?", testTxnId);
    }
}
