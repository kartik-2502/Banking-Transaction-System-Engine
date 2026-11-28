package com.bank.transaction;

import com.bank.transaction.dto.AuthResponse;
import com.bank.transaction.dto.LoginRequest;
import com.bank.transaction.dto.loan.*;
import com.bank.transaction.model.Account;
import com.bank.transaction.repository.AccountRepository;
import com.bank.transaction.repository.LoanAuditLogRepository;
import com.bank.transaction.repository.LoanRepository;
import com.bank.transaction.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class LoanOfficerModuleIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private AuthService authService;
    @Autowired private AccountRepository accountRepository;
    @Autowired private LoanRepository loanRepository;
    @Autowired private LoanAuditLogRepository auditLogRepository;

    private String loginJwt(String username) {
        AuthResponse auth = authService.login(new LoginRequest(username, "password"));
        assertNotNull(auth.getAccessToken());
        return "Bearer " + auth.getAccessToken();
    }

    @Test
    @DisplayName("1. Loan Officer login returns granular LOAN_* authorities & officer branch profile metadata")
    void testLoanOfficerLoginAndDashboard() throws Exception {
        AuthResponse auth = authService.login(new LoginRequest("ananya_verma", "password"));
        assertTrue(auth.getRoles().contains("ROLE_LOAN_OFFICER"));
        assertTrue(auth.getPermissions().contains("LOAN_DASHBOARD_VIEW"));
        assertTrue(auth.getPermissions().contains("LOAN_CREDIT_ASSESS"));
        assertFalse(auth.getPermissions().contains("LOAN_FINAL_APPROVE"));
        assertEquals("EMP3041", auth.getEmployeeId());
        assertEquals("LO301", auth.getOfficerId());
        assertEquals("BR001", auth.getBranchCode());

        mockMvc.perform(get("/api/loan-officer/dashboard")
                        .header("Authorization", "Bearer " + auth.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.officerProfile.officerId").value("LO301"))
                .andExpect(jsonPath("$.data.officerProfile.branchCode").value("BR001"))
                .andExpect(jsonPath("$.data.totalApplications").isNumber());
    }

    @Test
    @DisplayName("2. RBAC, branch isolation, and final approval restrictions are enforced on backend")
    void testAccessRestrictionsAndBranchIsolation() throws Exception {
        String customerJwt = loginJwt("aarav_sharma");
        String officerBr1Jwt = loginJwt("ananya_verma");
        String auditorJwt = loginJwt("elena_rostova");

        // Customer blocked from Loan Officer endpoints
        mockMvc.perform(get("/api/loan-officer/dashboard").header("Authorization", customerJwt))
                .andExpect(status().isForbidden());

        // Auditor is read-only: allowed reports, blocked from application creation
        mockMvc.perform(get("/api/loan-officer/reports").header("Authorization", auditorJwt))
                .andExpect(status().isOk());
        LoanApplicationSummaryDto.CreateRequest validBody = new LoanApplicationSummaryDto.CreateRequest();
        validBody.setCustomerNumber("CUST1001");
        validBody.setAccountNumber("ACC1001");
        validBody.setLoanCategory("PERSONAL");
        validBody.setRequestedAmount(new BigDecimal("50000.00"));
        validBody.setTenureMonths(12);
        validBody.setEmploymentType("SALARIED");
        validBody.setMonthlyIncome(new BigDecimal("50000.00"));
        validBody.setLoanPurpose("Audit security check");
        mockMvc.perform(post("/api/loan-officer/applications")
                        .header("Authorization", auditorJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validBody)))
                .andExpect(status().isForbidden());

        // Branch isolation: BR001 officer blocked from BR002 customer & loan
        mockMvc.perform(get("/api/loan-officer/customers/CUST2001").header("Authorization", officerBr1Jwt))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/loan-officer/applications/LN_SEED_BR2_01/workspace").header("Authorization", officerBr1Jwt))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("3. Full E2E Loan Lifecycle: Create -> Upload/Verify Docs -> Credit Calc -> Recommend -> Manager Approve -> Disburse -> EMI Schedule -> Overdue -> Audit")
    void testCompleteLoanOfficerLifecycle() throws Exception {
        String officerJwt = loginJwt("ananya_verma");
        String managerJwt = loginJwt("vikram_mehta");

        // 3a. Create assisted Home/Personal Loan Application on ACC2004 (preserving ACC1001 balance invariant)
        LoanApplicationSummaryDto.CreateRequest createReq = new LoanApplicationSummaryDto.CreateRequest();
        createReq.setCustomerNumber("CUST1002");
        createReq.setAccountNumber("ACC2004");
        createReq.setLoanCategory("HOME");
        createReq.setRequestedAmount(new BigDecimal("120000.00"));
        createReq.setTenureMonths(24);
        createReq.setInterestRate(new BigDecimal("8.50"));
        createReq.setEmploymentType("SALARIED");
        createReq.setMonthlyIncome(new BigDecimal("90000.00"));
        createReq.setExistingLiabilities(new BigDecimal("5000.00"));
        createReq.setCreditScore(780);
        createReq.setLoanPurpose("Residential Expansion Integration Test");
        createReq.setCollateralType("RESIDENTIAL_PROPERTY");
        createReq.setCollateralValue(new BigDecimal("400000.00"));

        MvcResult createRes = mockMvc.perform(post("/api/loan-officer/applications")
                        .header("Authorization", officerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.data.loanCategory").value("HOME"))
                .andReturn();

        String loanId = objectMapper.readTree(createRes.getResponse().getContentAsString())
                .get("data").get("loanId").asText();

        // 3b. Document Upload + Verify + Authorized Download
        MockMultipartFile pdf = new MockMultipartFile("file", "pan_proof.pdf", "application/pdf", "Sample PAN Document".getBytes());
        MvcResult docRes = mockMvc.perform(multipart("/api/loan-officer/applications/{loanId}/documents", loanId)
                        .file(pdf)
                        .param("documentType", "PAN_CARD")
                        .param("remarks", "PAN front copy")
                        .header("Authorization", officerJwt))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.verificationStatus").value("PENDING"))
                .andReturn();
        String documentId = objectMapper.readTree(docRes.getResponse().getContentAsString())
                .get("data").get("documentId").asText();

        LoanDocumentDto.VerifyDecisionRequest docVerify = new LoanDocumentDto.VerifyDecisionRequest();
        docVerify.setStatus("VERIFIED");
        docVerify.setRemarks("Verified with original");
        mockMvc.perform(post("/api/loan-officer/documents/{docId}/verify", documentId)
                        .header("Authorization", officerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(docVerify)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verificationStatus").value("VERIFIED"));

        mockMvc.perform(get("/api/loan-officer/documents/{docId}/download", documentId)
                        .header("Authorization", officerJwt))
                .andExpect(status().isOk())
                .andExpect(content().bytes("Sample PAN Document".getBytes()));

        // 3c. Credit Assessment calculation accuracy (EMI, DTI, LTV)
        LoanCreditAssessmentDto.AssessRequest assessReq = new LoanCreditAssessmentDto.AssessRequest();
        assessReq.setMonthlyIncome(new BigDecimal("90000.00"));
        assessReq.setExistingDebt(new BigDecimal("5000.00"));
        assessReq.setRequestedAmount(new BigDecimal("120000.00"));
        assessReq.setInterestRate(new BigDecimal("8.50"));
        assessReq.setTenureMonths(24);
        assessReq.setCreditScore(780);
        assessReq.setCollateralValue(new BigDecimal("400000.00"));
        assessReq.setOfficerRemarks("Low risk prime borrower");
        assessReq.setSaveToApplication(true);

        mockMvc.perform(post("/api/loan-officer/applications/{loanId}/credit-assessment", loanId)
                        .header("Authorization", officerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assessReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.riskCategory").value("LOW"))
                .andExpect(jsonPath("$.data.recommendation").value("RECOMMENDED"))
                .andExpect(jsonPath("$.data.ltvRatio").value(30.00));

        // 3d. Maker-Checker Approval Recommendation + Final Approval Authority Restriction
        LoanApprovalDto.RecommendRequest recReq = new LoanApprovalDto.RecommendRequest();
        recReq.setRecommendedAction("APPROVE");
        recReq.setRecommendedAmount(new BigDecimal("120000.00"));
        recReq.setRecommendedInterestRate(new BigDecimal("8.50"));
        recReq.setRecommendedTermMonths(24);
        recReq.setOfficerRemarks("All documents & credit metrics clear");

        MvcResult recRes = mockMvc.perform(post("/api/loan-officer/applications/{loanId}/recommend", loanId)
                        .header("Authorization", officerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(recReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andReturn();
        String approvalId = objectMapper.readTree(recRes.getResponse().getContentAsString())
                .get("data").get("approvalId").asText();

        // Loan Officer CANNOT grant final approval
        LoanApprovalDto.DecisionRequest approveDecision = new LoanApprovalDto.DecisionRequest();
        approveDecision.setDecision("APPROVED");
        approveDecision.setDecisionRemarks("Sanctioned by Credit Manager");
        mockMvc.perform(post("/api/loan-officer/approvals/{id}/decision", approvalId)
                        .header("Authorization", officerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveDecision)))
                .andExpect(status().isForbidden());

        // Bank Manager grants final approval
        mockMvc.perform(post("/api/loan-officer/approvals/{id}/decision", approvalId)
                        .header("Authorization", managerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveDecision)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"));

        // 3e. Disbursement initiation by Officer -> Release authorization by Manager
        Account acctBefore = accountRepository.findByAccountNumber("ACC2004").orElseThrow();
        BigDecimal balanceBefore = acctBefore.getBalance();

        LoanDisbursementDto.InitiateRequest initDisb = new LoanDisbursementDto.InitiateRequest();
        initDisb.setConditionsVerified(true);
        initDisb.setBeneficiaryVerified(true);
        initDisb.setRemarks("Ready for credit");

        MvcResult disbInitRes = mockMvc.perform(post("/api/loan-officer/applications/{loanId}/disbursement-initiate", loanId)
                        .header("Authorization", officerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(initDisb)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("INITIATED"))
                .andReturn();
        String disbId = objectMapper.readTree(disbInitRes.getResponse().getContentAsString())
                .get("data").get("disbursementId").asText();

        // Officer cannot authorize release
        mockMvc.perform(post("/api/loan-officer/disbursements/{id}/authorize", disbId)
                        .header("Authorization", officerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"approved\":true,\"remarks\":\"Self\"}"))
                .andExpect(status().isForbidden());

        // Manager releases funds atomically
        mockMvc.perform(post("/api/loan-officer/disbursements/{id}/authorize", disbId)
                        .header("Authorization", managerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"approved\":true,\"remarks\":\"Released to customer\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("DISBURSED"));

        BigDecimal balanceAfter = accountRepository.findByAccountNumber("ACC2004").orElseThrow().getBalance();
        assertEquals(0, balanceBefore.add(new BigDecimal("120000.00")).compareTo(balanceAfter));

        // 3f. EMI Schedule verification (24 installments generated) + Overdue + Communication + Report CSV + Audit Trail
        mockMvc.perform(get("/api/loan-officer/repayments/{loanId}", loanId)
                        .header("Authorization", officerJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.installments", hasSize(24)));

        mockMvc.perform(get("/api/loan-officer/overdue")
                        .header("Authorization", officerJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));

        LoanCommunicationDto.SendRequest commReq = new LoanCommunicationDto.SendRequest();
        commReq.setCustomerNumber("CUST1002");
        commReq.setLoanId(loanId);
        commReq.setCommunicationType("APPROVAL_DECISION_NOTICE");
        commReq.setSubject("Loan Sanctioned & Disbursed");
        commReq.setMessage("Your loan funds have been credited.");
        mockMvc.perform(post("/api/loan-officer/communications")
                        .header("Authorization", officerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(commReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.deliveryStatus").value("SENT_INTERNAL"));

        mockMvc.perform(get("/api/loan-officer/reports/export/csv")
                        .header("Authorization", officerJwt))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", containsString("text/csv")))
                .andExpect(content().string(containsString("LoanId,Category,Branch,CustomerNumber")));

        Long dbLoanId = loanRepository.findByLoanId(loanId).orElseThrow().getId();
        assertFalse(auditLogRepository.findByLoanIdOrderByCreatedAtDesc(dbLoanId).isEmpty(),
                "Immutable audit logs must record every Loan Officer lifecycle action");
    }
}
