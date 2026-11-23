package com.bank.transaction;

import com.bank.transaction.dto.AccountCreateRequest;
import com.bank.transaction.dto.AccountStatusUpdateRequest;
import com.bank.transaction.dto.CustomerCreateRequest;
import com.bank.transaction.dto.CustomerUpdateRequest;
import com.bank.transaction.model.AccountStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class CustomerAndAccountControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("End-to-End: Create customer, verify unique customer number, and retrieve profile")
    void testCreateCustomerAndRetrieveProfile() throws Exception {
        CustomerCreateRequest request = new CustomerCreateRequest(
                "Alice",
                "Wonder",
                "alice." + System.currentTimeMillis() + "@apexbank.com",
                "+91 9876500001",
                "404 Silicon Oasis, Bangalore"
        );

        MvcResult result = mockMvc.perform(post("/api/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.customerNumber", startsWith("CUST")))
                .andExpect(jsonPath("$.data.firstName").value("Alice"))
                .andExpect(jsonPath("$.data.lastName").value("Wonder"))
                .andReturn();

        String responseJson = result.getResponse().getContentAsString();
        String customerNumber = objectMapper.readTree(responseJson).get("data").get("customerNumber").asText();
        assertNotNull(customerNumber);

        // Retrieve customer details by customer number
        mockMvc.perform(get("/api/customers/{customerNumber}", customerNumber))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.customerNumber").value(customerNumber))
                .andExpect(jsonPath("$.data.email").value(request.getEmail()));
    }

    @Test
    @DisplayName("End-to-End: Update customer details and retrieve updated profile")
    void testUpdateCustomer() throws Exception {
        CustomerCreateRequest createReq = new CustomerCreateRequest(
                "Robert",
                "Patterson",
                "robert." + System.currentTimeMillis() + "@apexbank.com",
                "+91 9876500002",
                "Old Address 12"
        );

        MvcResult createRes = mockMvc.perform(post("/api/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String customerNumber = objectMapper.readTree(createRes.getResponse().getContentAsString())
                .get("data").get("customerNumber").asText();

        CustomerUpdateRequest updateReq = new CustomerUpdateRequest(
                "Robert",
                "Patterson Jr",
                "+91 9999900002",
                "Updated Villa 44, New Delhi"
        );

        mockMvc.perform(put("/api/customers/{customerNumber}", customerNumber)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.lastName").value("Patterson Jr"))
                .andExpect(jsonPath("$.data.phone").value("+91 9999900002"))
                .andExpect(jsonPath("$.data.address").value("Updated Villa 44, New Delhi"));
    }

    @Test
    @DisplayName("End-to-End: Create account for seeded customer CUST1001, verify limits & status history")
    void testCreateAccountAndCheckLimits() throws Exception {
        AccountCreateRequest request = new AccountCreateRequest(
                "CUST1001",
                new BigDecimal("5000.00"),
                "INR"
        );
        request.setDailyLimit(new BigDecimal("75000.00"));
        request.setPerTransactionLimit(new BigDecimal("25000.00"));

        MvcResult res = mockMvc.perform(post("/api/accounts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.accountNumber", startsWith("ACC")))
                .andExpect(jsonPath("$.data.customerNumber").value("CUST1001"))
                .andExpect(jsonPath("$.data.balance").value(5000.00))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.dailyLimit").value(75000.00))
                .andExpect(jsonPath("$.data.perTransactionLimit").value(25000.00))
                .andReturn();

        String accountNumber = objectMapper.readTree(res.getResponse().getContentAsString())
                .get("data").get("accountNumber").asText();

        // Check customer's accounts endpoint
        mockMvc.perform(get("/api/customers/{customerNumber}/accounts", "CUST1001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));

        // Check account status history
        mockMvc.perform(get("/api/accounts/{accountNumber}/history", accountNumber))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[0].newStatus").value("ACTIVE"));
    }

    @Test
    @DisplayName("End-to-End: Freeze account with audit reason and verify history record")
    void testAccountStatusUpdateAndHistory() throws Exception {
        // Create an account
        AccountCreateRequest createReq = new AccountCreateRequest(
                "CUST1002",
                new BigDecimal("12000.00"),
                "INR"
        );
        MvcResult res = mockMvc.perform(post("/api/accounts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String accountNumber = objectMapper.readTree(res.getResponse().getContentAsString())
                .get("data").get("accountNumber").asText();

        // Transition status from ACTIVE -> FROZEN
        AccountStatusUpdateRequest statusReq = new AccountStatusUpdateRequest(
                AccountStatus.FROZEN,
                "Suspicious multiple rapid logins detected",
                "SECURITY_ANALYST"
        );

        mockMvc.perform(put("/api/accounts/{accountNumber}/status", accountNumber)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(statusReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("FROZEN"));

        // Verify status change history
        mockMvc.perform(get("/api/accounts/{accountNumber}/history", accountNumber))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].previousStatus").value("ACTIVE"))
                .andExpect(jsonPath("$.data[0].newStatus").value("FROZEN"))
                .andExpect(jsonPath("$.data[0].reason").value("Suspicious multiple rapid logins detected"))
                .andExpect(jsonPath("$.data[0].changedBy").value("SECURITY_ANALYST"));
    }

    @Test
    @DisplayName("Negative Scenario: Reject account creation with negative initial balance")
    void testRejectNegativeInitialBalance() throws Exception {
        AccountCreateRequest request = new AccountCreateRequest(
                "CUST1001",
                new BigDecimal("-250.00"),
                "INR"
        );

        mockMvc.perform(post("/api/accounts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"));
    }

    @Test
    @DisplayName("Negative Scenario: Non-existent customer returns HTTP 404")
    void testCustomerNotFound() throws Exception {
        mockMvc.perform(get("/api/customers/CUST_NON_EXISTENT_9999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("CUSTOMER_NOT_FOUND"));
    }
}
