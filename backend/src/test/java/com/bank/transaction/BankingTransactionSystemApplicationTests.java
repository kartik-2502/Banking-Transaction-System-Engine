package com.bank.transaction;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class BankingTransactionSystemApplicationTests {

    @Test
    @DisplayName("Smoke Test: Verify application main class is accessible")
    void contextLoads() {
        BankingTransactionSystemApplication app = new BankingTransactionSystemApplication();
        assertNotNull(app, "Application instance should be instantiated successfully");
    }
}
