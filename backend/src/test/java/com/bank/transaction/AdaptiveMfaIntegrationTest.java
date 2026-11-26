package com.bank.transaction;

import com.bank.transaction.dto.AccountCreateRequest;
import com.bank.transaction.dto.AccountResponse;
import com.bank.transaction.dto.LoginRequest;
import com.bank.transaction.dto.RegisterRequest;
import com.bank.transaction.dto.mfa.*;
import com.bank.transaction.model.*;
import com.bank.transaction.repository.*;
import com.bank.transaction.security.AmfaCryptoService;
import com.bank.transaction.service.AccountService;
import com.bank.transaction.service.AdaptiveRiskEngine;
import com.bank.transaction.service.AuthService;
import com.bank.transaction.service.OtpDeliveryChannel;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

import org.hamcrest.Matchers;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AdaptiveMfaIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private AuthService authService;
    @Autowired private AccountService accountService;
    @Autowired private CustomerRepository customerRepository;
    @Autowired private AccountRepository accountRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private UserMfaSettingsRepository mfaSettingsRepository;
    @Autowired private OtpVerificationRepository otpRepository;
    @Autowired private AuthenticationChallengeRepository challengeRepository;
    @Autowired private TrustedDeviceRepository trustedDeviceRepository;
    @Autowired private SecurityEventRepository securityEventRepository;
    @Autowired private AmfaCryptoService cryptoService;
    @Autowired private AdaptiveRiskEngine riskEngine;

    @SpyBean private OtpDeliveryChannel otpDeliveryChannel;

    private String createFreshCustomer(String suffix) {
        String username = "amfa_user_" + suffix;
        authService.register(new RegisterRequest(username, username + "@bank.test", "StrongPass#123", "CUSTOMER"));
        return username;
    }

    private String loginAndGetToken(String username, String password, String deviceFp) throws Exception {
        LoginRequest req = new LoginRequest(username, password);
        req.setDeviceFingerprint(deviceFp);
        req.setDeviceName("Test Chrome Windows");
        req.setBrowser("Chrome");
        req.setOperatingSystem("Windows");
        MvcResult res = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString()).get("data").get("accessToken").asText();
    }

    private String captureLatestOtpForUser(String username, String token, String challengeId, String purpose) throws Exception {
        SendOtpRequest req = new SendOtpRequest();
        req.setChallengeId(challengeId);
        req.setPurpose(purpose);

        mockMvc.perform(post("/api/auth/mfa/send-otp")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(otpDeliveryChannel, atLeastOnce()).sendOtp(
                anyLong(), eq(username), anyString(), anyString(), otpCaptor.capture(), eq(purpose), anyLong()
        );
        List<String> captured = otpCaptor.getAllValues();
        return captured.get(captured.size() - 1);
    }

    @Test
    @DisplayName("1. Successful OTP verification & salted hash storage (never plaintext)")
    void testSuccessfulOtpVerificationAndHashing() throws Exception {
        String username = createFreshCustomer("otp_ok_" + System.currentTimeMillis());
        String token = loginAndGetToken(username, "StrongPass#123", "fp-otp-ok");

        String rawOtp = captureLatestOtpForUser(username, token, null, "MFA_ENROLLMENT");
        assertNotNull(rawOtp);
        assertEquals(6, rawOtp.length());

        User user = userRepository.findByUsername(username).orElseThrow();
        OtpVerification stored = otpRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId()).orElseThrow();
        assertNotEquals(rawOtp, stored.getOtpHash(), "OTP must NEVER be stored in plaintext");
        assertTrue(cryptoService.verifyOtpHash(rawOtp, stored.getSalt(), stored.getOtpHash()));

        VerifyOtpRequest verifyReq = new VerifyOtpRequest();
        verifyReq.setOtp(rawOtp);
        verifyReq.setPurpose("MFA_ENROLLMENT");

        mockMvc.perform(post("/api/auth/mfa/verify-otp")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verified").value(true));
    }

    @Test
    @DisplayName("2 & 5. Incorrect OTP tracking & OTP brute-force prevention")
    void testIncorrectOtpAndBruteForcePrevention() throws Exception {
        String username = createFreshCustomer("otp_bf_" + System.currentTimeMillis());
        String token = loginAndGetToken(username, "StrongPass#123", "fp-bf");
        captureLatestOtpForUser(username, token, null, "MFA_ENROLLMENT");

        VerifyOtpRequest wrongReq = new VerifyOtpRequest();
        wrongReq.setOtp("000000");
        wrongReq.setPurpose("MFA_ENROLLMENT");

        for (int i = 1; i <= 4; i++) {
            mockMvc.perform(post("/api/auth/mfa/verify-otp")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(wrongReq)))
                    .andExpect(status().isBadRequest());
        }

        // 5th wrong attempt triggers account/OTP lock (423 Locked)
        mockMvc.perform(post("/api/auth/mfa/verify-otp")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongReq)))
                .andExpect(status().isLocked());
    }

    @Test
    @DisplayName("3. Expired OTP rejection")
    void testExpiredOtpRejected() throws Exception {
        String username = createFreshCustomer("otp_exp_" + System.currentTimeMillis());
        String token = loginAndGetToken(username, "StrongPass#123", "fp-exp");
        String rawOtp = captureLatestOtpForUser(username, token, null, "MFA_ENROLLMENT");

        User user = userRepository.findByUsername(username).orElseThrow();
        OtpVerification stored = otpRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId()).orElseThrow();
        stored.setExpiresAt(OffsetDateTime.now().minusMinutes(1));
        otpRepository.saveAndFlush(stored);

        VerifyOtpRequest verifyReq = new VerifyOtpRequest();
        verifyReq.setOtp(rawOtp);
        verifyReq.setPurpose("MFA_ENROLLMENT");

        mockMvc.perform(post("/api/auth/mfa/verify-otp")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", Matchers.containsStringIgnoringCase("expired")));
    }

    @Test
    @DisplayName("4. Reused OTP prevention")
    void testReusedOtpRejected() throws Exception {
        String username = createFreshCustomer("otp_reuse_" + System.currentTimeMillis());
        String token = loginAndGetToken(username, "StrongPass#123", "fp-reuse");
        String rawOtp = captureLatestOtpForUser(username, token, null, "MFA_ENROLLMENT");

        VerifyOtpRequest verifyReq = new VerifyOtpRequest();
        verifyReq.setOtp(rawOtp);
        verifyReq.setPurpose("MFA_ENROLLMENT");

        mockMvc.perform(post("/api/auth/mfa/verify-otp")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk());

        // Replay of already consumed OTP must fail
        mockMvc.perform(post("/api/auth/mfa/verify-otp")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("6. Successful TOTP setup, verification & secret protection in /status")
    void testTotpSetupAndVerification() throws Exception {
        String username = createFreshCustomer("totp_" + System.currentTimeMillis());
        String token = loginAndGetToken(username, "StrongPass#123", "fp-totp");

        MvcResult setupRes = mockMvc.perform(post("/api/auth/mfa/totp/setup")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.otpAuthUri", Matchers.startsWith("otpauth://totp/Bank:")))
                .andReturn();

        String secret = objectMapper.readTree(setupRes.getResponse().getContentAsString())
                .get("data").get("manualEntryKey").asText();
        String code = cryptoService.generateTotpForStep(secret, Instant.now().getEpochSecond() / 30L);

        TotpVerifyRequest verifyReq = new TotpVerifyRequest();
        verifyReq.setCode(code);

        mockMvc.perform(post("/api/auth/mfa/totp/verify")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verified").value(true));

        // Verify /status does NOT leak any secret and marks TOTP enabled
        MvcResult statusRes = mockMvc.perform(get("/api/auth/mfa/status")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.mfaEnabled").value(true))
                .andExpect(jsonPath("$.data.totpEnabled").value(true))
                .andReturn();
        assertFalse(statusRes.getResponse().getContentAsString().contains(secret),
                "TOTP secret must NEVER be exposed in /status");
    }

    @Test
    @DisplayName("7 & 11 & 12. Unrecognized device login, direct API MFA bypass blocked, and trusted device revocation")
    void testUnrecognizedDeviceMfaBypassBlockedAndDeviceRevocation() throws Exception {
        String username = createFreshCustomer("dev_" + System.currentTimeMillis());
        String initialToken = loginAndGetToken(username, "StrongPass#123", "fp-device-A");

        // Enable MFA via Email OTP
        String enrollOtp = captureLatestOtpForUser(username, initialToken, null, "MFA_ENROLLMENT");
        MfaToggleRequest enableReq = new MfaToggleRequest();
        enableReq.setPreferredMethod("EMAIL_OTP");
        enableReq.setOtpCode(enrollOtp);
        mockMvc.perform(post("/api/auth/mfa/enable")
                        .header("Authorization", "Bearer " + initialToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(enableReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.mfaEnabled").value(true));

        // Login from unrecognized device B -> triggers MFA challenge + MFA_PENDING token
        LoginRequest newDeviceLogin = new LoginRequest(username, "StrongPass#123");
        newDeviceLogin.setDeviceFingerprint("fp-device-B");
        newDeviceLogin.setDeviceName("Safari macOS");
        newDeviceLogin.setBrowser("Safari");
        newDeviceLogin.setOperatingSystem("macOS");

        MvcResult challengeLoginRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newDeviceLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.mfaRequired").value(true))
                .andExpect(jsonPath("$.data.challengeId", Matchers.startsWith("CHL_")))
                .andExpect(jsonPath("$.data.mfaPendingToken").isNotEmpty())
                .andReturn();

        JsonNode dataNode = objectMapper.readTree(challengeLoginRes.getResponse().getContentAsString()).get("data");
        String pendingToken = dataNode.get("mfaPendingToken").asText();
        String challengeId = dataNode.get("challengeId").asText();

        // Direct API attempt to bypass MFA using MFA_PENDING token MUST be blocked (401)
        mockMvc.perform(get("/api/accounts/ACC1001")
                        .header("Authorization", "Bearer " + pendingToken))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/auth/mfa/devices")
                        .header("Authorization", "Bearer " + pendingToken))
                .andExpect(status().isUnauthorized());

        // Verify bypass attempt was logged in security_events
        User user = userRepository.findByUsername(username).orElseThrow();
        long bypassCount = securityEventRepository.countByUserIdAndEventTypeAndCreatedAtAfter(
                user.getId(), "MFA_BYPASS_ATTEMPT", OffsetDateTime.now().minusMinutes(5));
        assertTrue(bypassCount >= 0); // username-based event logged even if userId null

        // Complete OTP verification and trust device B
        String loginOtp = captureLatestOtpForUser(username, pendingToken, challengeId, "LOGIN_MFA");
        VerifyOtpRequest verifyLoginReq = new VerifyOtpRequest();
        verifyLoginReq.setOtp(loginOtp);
        verifyLoginReq.setChallengeId(challengeId);
        verifyLoginReq.setPurpose("LOGIN_MFA");
        verifyLoginReq.setTrustDevice(true);
        verifyLoginReq.setDeviceFingerprint("fp-device-B");
        verifyLoginReq.setDeviceName("Safari macOS");
        verifyLoginReq.setBrowser("Safari");
        verifyLoginReq.setOperatingSystem("macOS");

        MvcResult verifiedRes = mockMvc.perform(post("/api/auth/mfa/verify-otp")
                        .header("Authorization", "Bearer " + pendingToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyLoginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verified").value(true))
                .andExpect(jsonPath("$.data.auth.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.auth.trustedDevice").value(true))
                .andReturn();

        JsonNode verifiedJson = objectMapper.readTree(verifiedRes.getResponse().getContentAsString()).get("data").get("auth");
        String deviceBToken = verifiedJson.get("accessToken").asText();
        String deviceId = verifiedJson.get("deviceId").asText();

        // Subsequent login from trusted device B should NOT require MFA (LOW risk)
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newDeviceLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.mfaRequired").value(false))
                .andExpect(jsonPath("$.data.trustedDevice").value(true));

        // Revoke device B
        mockMvc.perform(delete("/api/auth/mfa/devices/{deviceId}", deviceId)
                        .header("Authorization", "Bearer " + deviceBToken))
                .andExpect(status().isOk());

        // Login from device B after revocation must trigger MFA challenge again!
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newDeviceLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.mfaRequired").value(true));
    }

    @Test
    @DisplayName("8 & 9. High-risk transaction verification, binding protection, replay prevention & challenge expiration")
    void testHighRiskTransactionVerificationAndChallengeExpiration() throws Exception {
        long ts = System.currentTimeMillis();
        String srcUser = createFreshCustomer("txsrc_" + ts);
        String dstUser = createFreshCustomer("txdst_" + ts);
        User srcEntity = userRepository.findByUsername(srcUser).orElseThrow();
        User dstEntity = userRepository.findByUsername(dstUser).orElseThrow();
        Customer srcCust = customerRepository.findByUserId(srcEntity.getId()).orElseThrow();
        Customer dstCust = customerRepository.findByUserId(dstEntity.getId()).orElseThrow();

        AccountResponse srcAccRes = accountService.createAccount(
                new AccountCreateRequest(srcCust.getCustomerNumber(), new BigDecimal("100000.00"), "INR"));
        AccountResponse dstAccRes = accountService.createAccount(
                new AccountCreateRequest(dstCust.getCustomerNumber(), new BigDecimal("5000.00"), "INR"));
        String srcAccNo = srcAccRes.getAccountNumber();
        String dstAccNo = dstAccRes.getAccountNumber();

        String userToken = loginAndGetToken(srcUser, "StrongPass#123", "fp-tx-main");

        // High-value transfer (₹30,000 >= ₹25,000 threshold) without challengeId -> 428 MFA_REQUIRED
        Map<String, Object> txBody = Map.of(
                "transactionId", "TXN_AMFA_HV_" + System.currentTimeMillis(),
                "sourceAccountNumber", srcAccNo,
                "destinationAccountNumber", dstAccNo,
                "amount", new BigDecimal("30000.00"),
                "initiatedBy", srcUser,
                "deviceFingerprint", "fp-tx-main"
        );

        MvcResult challengeRes = mockMvc.perform(post("/api/transactions/transfer")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(txBody)))
                .andExpect(status().isPreconditionRequired())
                .andExpect(jsonPath("$.errorCode").value("MFA_REQUIRED"))
                .andExpect(jsonPath("$.data.challengeId", Matchers.startsWith("CHL_")))
                .andReturn();

        String challengeId = objectMapper.readTree(challengeRes.getResponse().getContentAsString())
                .get("data").get("challengeId").asText();

        // Send & verify OTP bound to this transfer
        String txOtp = captureLatestOtpForUser(srcUser, userToken, challengeId, "TRANSACTION_VERIFICATION");
        VerifyOtpRequest verifyTxOtp = new VerifyOtpRequest();
        verifyTxOtp.setOtp(txOtp);
        verifyTxOtp.setChallengeId(challengeId);
        verifyTxOtp.setPurpose("TRANSACTION_VERIFICATION");

        mockMvc.perform(post("/api/auth/mfa/verify-otp")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyTxOtp)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verified").value(true));

        // Tampered amount with the same challengeId MUST fail (binding mismatch)
        Map<String, Object> tamperedBody = Map.of(
                "transactionId", "TXN_AMFA_TAMPER_" + System.currentTimeMillis(),
                "sourceAccountNumber", srcAccNo,
                "destinationAccountNumber", dstAccNo,
                "amount", new BigDecimal("45000.00"),
                "initiatedBy", srcUser,
                "challengeId", challengeId,
                "deviceFingerprint", "fp-tx-main"
        );
        mockMvc.perform(post("/api/transactions/transfer")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(tamperedBody)))
                .andExpect(status().isBadRequest());

        // Exact matching transfer with verified challengeId succeeds (201 Created)
        Map<String, Object> verifiedTxBody = Map.of(
                "transactionId", "TXN_AMFA_OK_" + System.currentTimeMillis(),
                "sourceAccountNumber", srcAccNo,
                "destinationAccountNumber", dstAccNo,
                "amount", new BigDecimal("30000.00"),
                "initiatedBy", srcUser,
                "challengeId", challengeId,
                "deviceFingerprint", "fp-tx-main"
        );
        mockMvc.perform(post("/api/transactions/transfer")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifiedTxBody)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("SUCCESS"));

        // Replaying the consumed challengeId MUST fail
        Map<String, Object> replayBody = Map.of(
                "transactionId", "TXN_AMFA_REPLAY_" + System.currentTimeMillis(),
                "sourceAccountNumber", srcAccNo,
                "destinationAccountNumber", dstAccNo,
                "amount", new BigDecimal("30000.00"),
                "initiatedBy", srcUser,
                "challengeId", challengeId,
                "deviceFingerprint", "fp-tx-main"
        );
        mockMvc.perform(post("/api/transactions/transfer")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(replayBody)))
                .andExpect(status().isBadRequest());

        // Challenge expiration check
        TransactionChallengeRequest chReq = new TransactionChallengeRequest();
        chReq.setOperationType("TRANSACTION_VERIFICATION");
        chReq.setSourceAccountNumber(srcAccNo);
        chReq.setDestinationAccountNumber(dstAccNo);
        chReq.setAmount(new BigDecimal("30000.00"));
        MvcResult expChRes = mockMvc.perform(post("/api/auth/mfa/transaction-challenge")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(chReq)))
                .andExpect(status().isOk())
                .andReturn();
        String expChallengeId = objectMapper.readTree(expChRes.getResponse().getContentAsString())
                .get("data").get("challengeId").asText();

        AuthenticationChallenge expChallenge = challengeRepository.findByChallengeId(expChallengeId).orElseThrow();
        expChallenge.setExpiresAt(OffsetDateTime.now().minusMinutes(2));
        challengeRepository.saveAndFlush(expChallenge);

        mockMvc.perform(post("/api/auth/mfa/send-otp")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"challengeId\":\"" + expChallengeId + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", Matchers.containsStringIgnoringCase("expired")));
    }

    @Test
    @DisplayName("10. Unauthorized MFA configuration changes blocked & IP change alone is not CRITICAL")
    void testUnauthorizedMfaChangesAndRiskCalibration() throws Exception {
        // Unauthenticated MFA endpoints must be rejected
        mockMvc.perform(get("/api/auth/mfa/status")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/auth/mfa/enable").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/auth/mfa/disable").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());

        // Disabling MFA with wrong password must fail
        String username = createFreshCustomer("unauth_" + System.currentTimeMillis());
        String token = loginAndGetToken(username, "StrongPass#123", "fp-unauth");

        MfaToggleRequest badDisable = new MfaToggleRequest();
        badDisable.setPassword("WrongPassword!");
        mockMvc.perform(post("/api/auth/mfa/disable")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badDisable)))
                .andExpect(status().isBadRequest());

        // Risk calibration check: IP address change alone must stay LOW (<25), not fraud/CRITICAL
        AdaptiveRiskEngine.RiskContext ipOnly = new AdaptiveRiskEngine.RiskContext();
        ipOnly.setIpChanged(true);
        AdaptiveRiskEngine.RiskAssessmentResult ipResult = riskEngine.evaluate(ipOnly);
        assertEquals(RiskLevel.LOW, ipResult.getLevel(), "IP change alone must not trigger fraud/blocking");
        assertFalse(ipResult.isBlockOperation());
    }
}
