package com.bank.transaction.controller;

import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    public HealthController(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/db")
    public ResponseEntity<Map<String, Object>> checkDatabaseHealth() {
        Map<String, Object> response = new HashMap<>();
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            OffsetDateTime dbTime = jdbcTemplate.queryForObject("SELECT CURRENT_TIMESTAMP", OffsetDateTime.class);

            response.put("status", "UP");
            response.put("databaseProduct", metaData.getDatabaseProductName());
            response.put("databaseVersion", metaData.getDatabaseProductVersion());
            response.put("databaseUser", metaData.getUserName());
            response.put("databaseTime", dbTime);

            if (dataSource instanceof HikariDataSource hikari) {
                HikariPoolMXBean poolBean = hikari.getHikariPoolMXBean();
                Map<String, Object> poolInfo = new HashMap<>();
                poolInfo.put("poolName", hikari.getPoolName());
                poolInfo.put("maxPoolSize", hikari.getMaximumPoolSize());
                if (poolBean != null) {
                    poolInfo.put("totalConnections", poolBean.getTotalConnections());
                    poolInfo.put("activeConnections", poolBean.getActiveConnections());
                    poolInfo.put("idleConnections", poolBean.getIdleConnections());
                    poolInfo.put("threadsAwaitingConnection", poolBean.getThreadsAwaitingConnection());
                }
                response.put("connectionPool", poolInfo);
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "DOWN");
            response.put("error", e.getMessage());
            return ResponseEntity.status(503).body(response);
        }
    }
}
