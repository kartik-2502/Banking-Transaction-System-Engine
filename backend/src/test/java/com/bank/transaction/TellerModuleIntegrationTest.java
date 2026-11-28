package com.bank.transaction;

import com.bank.transaction.dto.AuthResponse;
import com.bank.transaction.dto.LoginRequest;
import com.bank.transaction.dto.teller.*;
import com.bank.transaction.model.Account;
import com.bank.transaction.model.AuthenticationChallenge;
import com.bank.transaction.model.ChallengeStatus;
import com.bank.transaction.model.TellerDrawer;
import com.bank.transaction.repository.AccountRepository;
import com.bank.transaction.repository.AuthenticationChallengeRepository;
import com.bank.transaction.repository.TellerDrawerRepository;
import com.bank.transaction.service.AuthService;
import com.fasterxml.jackson.databind.JsonNode;
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
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class TellerModuleIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuthService authService;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private TellerDrawerRepository tellerDrawerRepository;

    @Autowired
    private AuthenticationChallengeRepository challengeRepository;

    private String loginJwt(String username) {
        AuthResponse auth = authService.login(new LoginRequest(username, "password"));
        assertNotNull(auth.getAccessToken(), "Expected JWT token for " + username);
        return "Bearer " + auth.getAccessToken();
    }

    private BigDecimal fetchDrawerBalance(String tellerJwt) throws Exception {
        MvcResult res = mockMvc.perform(get("/api/teller/drawer").header("Authorization", tellerJwt))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode root = objectMapper.readTree(res.getResponse().getContentAsString());
        return root.get("data").get("currentBalance").decimalValue();
    }

    @Test
    @DisplayName("1. Teller login returns full role, branch, drawer metadata & granular authorities")
    void testTellerLoginMetadataAndDashboard() throws Exception {
        AuthResponse tellerAuth = authService.login(new LoginRequest("rohan_kulkarni", "password"));
        assertTrue(tellerAuth.getRoles().contains("ROLE_TELLER"));
        assertTrue(tellerAuth.getPermissions().contains("CASH_DEPOSIT"));
        assertTrue(tellerAuth.getPermissions().contains("CASH_RECONCILIATION"));
        assertEquals("BR001", tellerAuth.getBranchCode());
        assertEquals("EMP2041", tellerAuth.getEmployeeId());
        assertEquals("TLR101", tellerAuth.getTellerId());

        mockMvc.perform(get("/api/teller/dashboard")
                        .header("Authorization", "Bearer " + tellerAuth.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.tellerProfile.username").value("rohan_kulkarni"))
                .andExpect(jsonPath("$.data.tellerProfile.branchCode").value("BR001"))
                .andExpect(jsonPath("$.data.drawerBalance").isNumber());
    }

    @Test
    @DisplayName("2. RBAC & Branch Isolation prevent unauthorized customer access, self-approval, and cross-branch operations")
    void testUnauthorizedAccessAndBranchIsolation() throws Exception {
        String customerJwt = loginJwt("aarav_sharma");
        String tellerBr1Jwt = loginJwt("rohan_kulkarni");
        String auditorJwt = loginJwt("elena_rostova");

        // Customer blocked from Teller endpoints
        mockMvc.perform(get("/api/teller/dashboard").header("Authorization", customerJwt))
                .andExpect(status().isForbidden());

        // Auditor is read-only: allowed dashboard & reports, blocked from cash deposit
        mockMvc.perform(get("/api/teller/reports/daily").header("Authorization", auditorJwt))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/teller/cash/deposit")
                        .header("Authorization", auditorJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"accountNumber\":\"ACC1001\",\"amount\":100}"))
                .andExpect(status().isForbidden());

        // Teller cannot approve KYC verification
        mockMvc.perform(put("/api/teller/customers/CUST1001/kyc")
                        .header("Authorization", tellerBr1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"kycStatus\":\"VERIFIED\"}"))
                .andExpect(status().isForbidden());

        // Branch isolation: BR001 teller blocked from BR002 customer CUST2001 & account ACC2101
        mockMvc.perform(get("/api/teller/customers/CUST2001/history").header("Authorization", tellerBr1Jwt))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/teller/accounts/ACC2101").header("Authorization", tellerBr1Jwt))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/teller/cash/deposit")
                        .header("Authorization", tellerBr1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"accountNumber\":\"ACC2101\",\"amount\":500,\"depositorName\":\"Test\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("3. Customer Search, Account Enquiry & Statement APIs work for assigned branch")
    void testCustomerSearchAccountEnquiryAndStatement() throws Exception {
        String tellerJwt = loginJwt("rohan_kulkarni");

        mockMvc.perform(get("/api/teller/customers")
                        .param("q", "Aarav")
                        .header("Authorization", tellerJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data.content[0].customerNumber").value("CUST1001"));

        mockMvc.perform(get("/api/teller/accounts/ACC1001")
                        .header("Authorization", tellerJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accountNumber").value("ACC1001"));

        mockMvc.perform(get("/api/teller/accounts/ACC1001/statement")
                        .header("Authorization", tellerJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("4. Cash Deposit, Cash Withdrawal, Insufficient Funds/Drawer Validation, and Atomic Ledger Updates")
    void testCashDepositWithdrawalAndValidation() throws Exception {
        String tellerJwt = loginJwt("rohan_kulkarni");

        // Ensure drawer is open
        mockMvc.perform(post("/api/teller/drawer/open")
                        .header("Authorization", tellerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"openingBalance\":250000.00}"))
                .andReturn();

        Account beforeAcct = accountRepository.findByAccountNumber("ACC2004").orElseThrow();
        BigDecimal startBalance = beforeAcct.getBalance();
        BigDecimal startDrawer = fetchDrawerBalance(tellerJwt);

        // Cash Deposit +2500
        TellerCashOperationRequest depReq = new TellerCashOperationRequest();
        depReq.setAccountNumber("ACC2004");
        depReq.setAmount(new BigDecimal("2500.00"));
        depReq.setDepositType("CASH_COUNTER");
        depReq.setDepositorName("Priya Patel");
        depReq.setRemarks("Test deposit");

        mockMvc.perform(post("/api/teller/cash/deposit")
                        .header("Authorization", tellerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(depReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("SUCCESS"))
                .andExpect(jsonPath("$.data.transactionId", startsWith("TLR_DEP_")));

        // Withdrawal without customer verification must fail
        TellerCashOperationRequest unverifiedWdr = new TellerCashOperationRequest();
        unverifiedWdr.setAccountNumber("ACC2004");
        unverifiedWdr.setAmount(new BigDecimal("500.00"));
        unverifiedWdr.setCustomerVerified(false);
        mockMvc.perform(post("/api/teller/cash/withdrawal")
                        .header("Authorization", tellerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(unverifiedWdr)))
                .andExpect(status().isBadRequest());

        // Insufficient account balance must fail
        TellerCashOperationRequest overBalance = new TellerCashOperationRequest();
        overBalance.setAccountNumber("ACC2004");
        overBalance.setAmount(new BigDecimal("99999999.00"));
        overBalance.setCustomerVerified(true);
        mockMvc.perform(post("/api/teller/cash/withdrawal")
                        .header("Authorization", tellerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(overBalance)))
                .andExpect(status().is4xxClientError());

        // Verified Cash Withdrawal -1000
        TellerCashOperationRequest wdrReq = new TellerCashOperationRequest();
        wdrReq.setAccountNumber("ACC2004");
        wdrReq.setAmount(new BigDecimal("1000.00"));
        wdrReq.setCustomerVerified(true);
        wdrReq.setRemarks("Verified counter withdrawal");

        mockMvc.perform(post("/api/teller/cash/withdrawal")
                        .header("Authorization", tellerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wdrReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("SUCCESS"));

        Account afterAcct = accountRepository.findByAccountNumber("ACC2004").orElseThrow();
        BigDecimal endDrawer = fetchDrawerBalance(tellerJwt);

        // Net +1500.00 on both account and drawer
        assertEquals(0, startBalance.add(new BigDecimal("1500.00")).compareTo(afterAcct.getBalance()));
        assertEquals(0, startDrawer.add(new BigDecimal("1500.00")).compareTo(endDrawer));
    }

    @Test
    @DisplayName("5. Duplicate transaction idempotency and concurrent cash deposits preserve exact balances")
    void testIdempotencyAndConcurrentCashDeposits() throws Exception {
        String tellerJwt = loginJwt("rohan_kulkarni");
        Account initialAcc = accountRepository.findByAccountNumber("ACC3005").orElseThrow();
        BigDecimal initialBal = initialAcc.getBalance();

        // Duplicate idempotency key test
        String dupTxnId = "TXN-IDEMP-" + System.currentTimeMillis();
        TellerCashOperationRequest req = new TellerCashOperationRequest();
        req.setTransactionId(dupTxnId);
        req.setAccountNumber("ACC3005");
        req.setAmount(new BigDecimal("400.00"));
        req.setDepositorName("Idempotency Check");

        mockMvc.perform(post("/api/teller/cash/deposit")
                        .header("Authorization", tellerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.transactionId").value(dupTxnId));

        // Second identical request should NOT double-credit
        mockMvc.perform(post("/api/teller/cash/deposit")
                        .header("Authorization", tellerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.transactionId").value(dupTxnId));

        BigDecimal afterIdemp = accountRepository.findByAccountNumber("ACC3005").orElseThrow().getBalance();
        assertEquals(0, initialBal.add(new BigDecimal("400.00")).compareTo(afterIdemp));

        // Concurrent cash deposits (5 parallel threads * 100.00 = +500.00)
        int threads = 5;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch ready = new CountDownLatch(threads);
        CountDownLatch go = new CountDownLatch(1);
        List<Future<Integer>> futures = new ArrayList<>();

        for (int i = 0; i < threads; i++) {
            final int idx = i;
            futures.add(pool.submit(() -> {
                ready.countDown();
                go.await();
                TellerCashOperationRequest concReq = new TellerCashOperationRequest();
                concReq.setTransactionId("TXN-CONC-" + System.currentTimeMillis() + "-" + idx);
                concReq.setAccountNumber("ACC3005");
                concReq.setAmount(new BigDecimal("100.00"));
                concReq.setDepositorName("Concurrent Thread " + idx);
                MvcResult res = mockMvc.perform(post("/api/teller/cash/deposit")
                                .header("Authorization", tellerJwt)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(concReq)))
                        .andReturn();
                return res.getResponse().getStatus();
            }));
        }

        assertTrue(ready.await(5, TimeUnit.SECONDS));
        go.countDown();
        for (Future<Integer> f : futures) {
            assertEquals(201, f.get(15, TimeUnit.SECONDS));
        }
        pool.shutdown();

        BigDecimal finalBal = accountRepository.findByAccountNumber("ACC3005").orElseThrow().getBalance();
        assertEquals(0, afterIdemp.add(new BigDecimal("500.00")).compareTo(finalBal),
                "Concurrent cash deposits must preserve exact locked balance");
    }

    @Test
    @DisplayName("6. Fund transfer, Cheque clearing, Service Requests, Complaints, Reconciliations & Daily Report CSV")
    void testEndToEndWorkflowsAndReporting() throws Exception {
        String tellerJwt = loginJwt("rohan_kulkarni");
        String managerJwt = loginJwt("vikram_mehta");

        // Internal transfer ACC3005 -> ACC2004 (handles Adaptive MFA step-up if triggered by test velocity)
        TellerTransferRequest trReq = new TellerTransferRequest();
        trReq.setSourceAccountNumber("ACC3005");
        trReq.setDestinationAccountNumber("ACC2004");
        trReq.setAmount(new BigDecimal("250.00"));
        trReq.setTransferChannel("INTERNAL");
        trReq.setRemarks("Integration test internal transfer");

        MvcResult trResult = mockMvc.perform(post("/api/teller/transfers")
                        .header("Authorization", tellerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(trReq)))
                .andReturn();

        if (trResult.getResponse().getStatus() == 428) {
            String challengeId = objectMapper.readTree(trResult.getResponse().getContentAsString())
                    .get("data").get("challengeId").asText();
            AuthenticationChallenge ch = challengeRepository.findByChallengeId(challengeId).orElseThrow();
            ch.setStatus(ChallengeStatus.VERIFIED);
            challengeRepository.save(ch);
            trReq.setChallengeId(challengeId);
            mockMvc.perform(post("/api/teller/transfers")
                            .header("Authorization", tellerJwt)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(trReq)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.status").value("SUCCESS"));
        } else {
            assertEquals(201, trResult.getResponse().getStatus());
            assertEquals("SUCCESS", objectMapper.readTree(trResult.getResponse().getContentAsString())
                    .get("data").get("status").asText());
        }

        // Register cheque on ACC2004 & test teller vs manager clearing control
        ChequeRequest chqReq = new ChequeRequest();
        chqReq.setChequeNumber("CHK-" + (System.currentTimeMillis() % 100000));
        chqReq.setAccountNumber("ACC2004");
        chqReq.setIssuingBankName("HDFC Bank");
        chqReq.setChequeDate(LocalDate.now());
        chqReq.setAmount(new BigDecimal("3500.00"));
        chqReq.setRequestType("DEPOSIT");

        MvcResult chqCreate = mockMvc.perform(post("/api/teller/cheques")
                        .header("Authorization", tellerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(chqReq)))
                .andExpect(status().isCreated())
                .andReturn();
        String chequeRef = objectMapper.readTree(chqCreate.getResponse().getContentAsString())
                .get("data").get("chequeRef").asText();

        // Teller cannot clear cheque
        ChequeStatusUpdateRequest clearReq = new ChequeStatusUpdateRequest();
        clearReq.setStatus("CLEARED");
        mockMvc.perform(post("/api/teller/cheques/{chequeRef}/status", chequeRef)
                        .header("Authorization", tellerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(clearReq)))
                .andExpect(status().isForbidden());

        // Manager can clear cheque
        mockMvc.perform(post("/api/teller/cheques/{chequeRef}/status", chequeRef)
                        .header("Authorization", managerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(clearReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CLEARED"));

        // Service request + manager approval
        ServiceRequestCreateDto srDto = new ServiceRequestCreateDto();
        srDto.setCustomerNumber("CUST1001");
        srDto.setAccountNumber("ACC1001");
        srDto.setRequestType("NOMINEE_UPDATE");
        srDto.setDescription("Update primary nominee on ACC1001");

        MvcResult srRes = mockMvc.perform(post("/api/teller/service-requests")
                        .header("Authorization", tellerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(srDto)))
                .andExpect(status().isCreated())
                .andReturn();
        String reqId = objectMapper.readTree(srRes.getResponse().getContentAsString())
                .get("data").get("requestId").asText();

        ApprovalDecisionRequest approveReq = new ApprovalDecisionRequest();
        approveReq.setApproved(true);
        approveReq.setRemarks("Verified nomination form");

        // Teller cannot approve service request
        mockMvc.perform(post("/api/teller/service-requests/{id}/decision", reqId)
                        .header("Authorization", tellerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveReq)))
                .andExpect(status().isForbidden());

        // Manager approves service request
        mockMvc.perform(post("/api/teller/service-requests/{id}/decision", reqId)
                        .header("Authorization", managerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.approvalStatus").value("APPROVED"));

        // Complaint creation -> escalation -> resolution
        ComplaintCreateRequest cmpDto = new ComplaintCreateRequest();
        cmpDto.setCustomerNumber("CUST1001");
        cmpDto.setAccountNumber("ACC1001");
        cmpDto.setCategory("FAILED_TRANSFER");
        cmpDto.setSubject("Delayed UPI confirmation");
        cmpDto.setDescription("Customer reported pending debit");
        cmpDto.setPriority("HIGH");

        MvcResult cmpRes = mockMvc.perform(post("/api/teller/complaints")
                        .header("Authorization", tellerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cmpDto)))
                .andExpect(status().isCreated())
                .andReturn();
        String complaintId = objectMapper.readTree(cmpRes.getResponse().getContentAsString())
                .get("data").get("complaintId").asText();

        mockMvc.perform(patch("/api/teller/complaints/{id}", complaintId)
                        .header("Authorization", managerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"RESOLVED\",\"internalRemarks\":\"Credited back\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("RESOLVED"));

        // Cash drawer reconciliation + manager verification + CSV export
        CashReconciliationRequest recReq = new CashReconciliationRequest();
        recReq.setDeclaredPhysicalCash(fetchDrawerBalance(tellerJwt));
        recReq.setRemarks("Shift balanced");

        MvcResult recRes = mockMvc.perform(post("/api/teller/drawer/reconcile")
                        .header("Authorization", tellerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(recReq)))
                .andExpect(status().isCreated())
                .andReturn();
        String reconId = objectMapper.readTree(recRes.getResponse().getContentAsString())
                .get("data").get("reconciliationId").asText();

        mockMvc.perform(post("/api/teller/drawer/reconciliations/{id}/verify", reconId)
                        .header("Authorization", managerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("VERIFIED"));

        // Re-open drawer for clean state
        mockMvc.perform(post("/api/teller/drawer/open")
                        .header("Authorization", tellerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"openingBalance\":250000.00}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/teller/reports/export/csv")
                        .header("Authorization", tellerJwt))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", containsString("text/csv")))
                .andExpect(content().string(containsString("TransactionId,Type,SourceAccount,DestinationAccount")));
    }
}
