package com.bank.transaction;

import com.bank.transaction.controller.HealthController;
import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class DatabaseConnectionIntegrationTest {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private HealthController healthController;

    @Test
    @DisplayName("Verify HikariCP DataSource is properly injected and configured")
    void testDataSourceInjection() {
        assertNotNull(dataSource, "DataSource bean must not be null");
        assertInstanceOf(HikariDataSource.class, dataSource, "DataSource should be an instance of HikariDataSource");

        HikariDataSource hikari = (HikariDataSource) dataSource;
        assertEquals("BankingHikariCP", hikari.getPoolName());
        assertEquals(30, hikari.getMaximumPoolSize());
    }

    @Test
    @DisplayName("Verify live PostgreSQL connection and query execution")
    void testLiveDatabaseConnection() throws SQLException {
        try (Connection connection = dataSource.getConnection()) {
            assertNotNull(connection, "Active connection must be acquired from pool");
            assertFalse(connection.isClosed(), "Connection must be open");

            String dbProduct = connection.getMetaData().getDatabaseProductName();
            assertEquals("PostgreSQL", dbProduct, "Database product must be PostgreSQL");
        }

        Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        assertEquals(1, result, "SELECT 1 query must return 1");

        String currentDb = jdbcTemplate.queryForObject("SELECT current_database()", String.class);
        assertEquals("banking_db", currentDb, "Target database must be banking_db");
    }

    @Test
    @DisplayName("Verify Database Health Endpoint returns status UP")
    void testHealthEndpoint() {
        ResponseEntity<Map<String, Object>> response = healthController.checkDatabaseHealth();
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());

        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals("UP", body.get("status"));
        assertEquals("PostgreSQL", body.get("databaseProduct"));
        assertNotNull(body.get("databaseTime"));
        assertNotNull(body.get("connectionPool"));
    }
}
