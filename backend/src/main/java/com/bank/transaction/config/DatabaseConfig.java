package com.bank.transaction.config;

import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;

@Configuration
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    @Bean
    public CommandLineRunner databaseConnectionVerifier(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        return args -> {
            log.info("Verifying PostgreSQL database connection...");
            try (Connection connection = dataSource.getConnection()) {
                DatabaseMetaData metaData = connection.getMetaData();
                String databaseProductName = metaData.getDatabaseProductName();
                String databaseProductVersion = metaData.getDatabaseProductVersion();
                String url = metaData.getURL();
                String userName = metaData.getUserName();

                // Test basic query
                Integer testResult = jdbcTemplate.queryForObject("SELECT 1", Integer.class);

                log.info("PostgreSQL Database Connected Successfully!");
                log.info("  Product: {} (Version: {})", databaseProductName, databaseProductVersion);
                log.info("  Connected URL: {}", url);
                log.info("  Database User: {}", userName);
                log.info("  Connectivity Verification Query (SELECT 1): Result={}", testResult);

                if (dataSource instanceof HikariDataSource hikari) {
                    log.info("  HikariCP Pool: '{}', MaxPoolSize: {}, IdleTimeout: {}ms",
                            hikari.getPoolName(),
                            hikari.getMaximumPoolSize(),
                            hikari.getIdleTimeout());
                }
            } catch (Exception e) {
                log.error("Failed to connect to PostgreSQL database: {}", e.getMessage(), e);
                throw e;
            }
        };
    }
}
