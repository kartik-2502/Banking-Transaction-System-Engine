package com.bank.transaction.security;

import com.bank.transaction.config.AmfaProperties;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

@Component
public class AmfaCryptoService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final int GCM_TAG_LENGTH_BITS = 128;
    private static final int GCM_IV_LENGTH_BYTES = 12;

    private final SecretKey aesKey;

    public AmfaCryptoService(AmfaProperties properties) {
        byte[] raw = Base64.getDecoder().decode(properties.getSecretEncryptionKey());
        byte[] keyBytes = new byte[32];
        System.arraycopy(raw, 0, keyBytes, 0, Math.min(raw.length, 32));
        this.aesKey = new SecretKeySpec(keyBytes, "AES");
    }

    public String generateNumericOtp(int digits) {
        int bound = (int) Math.pow(10, digits);
        int min = (int) Math.pow(10, digits - 1);
        int code = min + SECURE_RANDOM.nextInt(bound - min);
        return String.valueOf(code);
    }

    public String generateRandomSalt() {
        byte[] bytes = new byte[16];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public String hashOtp(String otp, String salt) {
        return sha256Hex(salt + ":" + otp);
    }

    public boolean verifyOtpHash(String candidateOtp, String salt, String expectedHash) {
        if (candidateOtp == null || salt == null || expectedHash == null) return false;
        String candidateHash = hashOtp(candidateOtp.trim(), salt);
        return MessageDigest.isEqual(
                candidateHash.getBytes(StandardCharsets.UTF_8),
                expectedHash.getBytes(StandardCharsets.UTF_8)
        );
    }

    public String hashDeviceFingerprint(Long userId, String clientFingerprint, String userAgent) {
        String normalizedFp = clientFingerprint != null ? clientFingerprint.trim() : "unknown";
        String normalizedUa = userAgent != null ? userAgent.trim().toLowerCase() : "unknown";
        return sha256Hex("DEV:" + userId + ":" + normalizedFp + ":" + normalizedUa);
    }

    public String computeTransactionBindingHash(Long userId, String operationType, String sourceAcc, String destAcc, BigDecimal amount) {
        String amtNorm = amount != null ? amount.stripTrailingZeros().toPlainString() : "0";
        String payload = (userId != null ? userId : 0L) + "|" +
                (operationType != null ? operationType : "") + "|" +
                (sourceAcc != null ? sourceAcc.trim().toUpperCase() : "") + "|" +
                (destAcc != null ? destAcc.trim().toUpperCase() : "") + "|" +
                amtNorm;
        return sha256Hex(payload);
    }

    public String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    public String encryptSecret(String plaintext) {
        try {
            byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
            SECURE_RANDOM.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, aesKey, new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
            byte[] cipherText = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            byte[] combined = new byte[iv.length + cipherText.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(cipherText, 0, combined, iv.length, cipherText.length);
            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to encrypt MFA secret", e);
        }
    }

    public String decryptSecret(String encrypted) {
        try {
            byte[] combined = Base64.getDecoder().decode(encrypted);
            byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
            byte[] cipherText = new byte[combined.length - GCM_IV_LENGTH_BYTES];
            System.arraycopy(combined, 0, iv, 0, iv.length);
            System.arraycopy(combined, iv.length, cipherText, 0, cipherText.length);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, aesKey, new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
            return new String(cipher.doFinal(cipherText), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to decrypt MFA secret", e);
        }
    }

    // ---- RFC 6238 TOTP ----
    public String generateTotpSecret() {
        byte[] buffer = new byte[20]; // 160-bit secret
        SECURE_RANDOM.nextBytes(buffer);
        return base32Encode(buffer);
    }

    public String buildOtpAuthUri(String issuer, String accountLabel, String base32Secret) {
        return String.format(
                "otpauth://totp/%s:%s?secret=%s&issuer=%s&algorithm=SHA1&digits=6&period=30",
                issuer, accountLabel, base32Secret, issuer
        );
    }

    public boolean verifyTotpCode(String base32Secret, String code, long epochSeconds) {
        if (base32Secret == null || code == null || !code.trim().matches("^\\d{6}$")) {
            return false;
        }
        long currentStep = epochSeconds / 30L;
        for (long offset = -1; offset <= 1; offset++) {
            String expected = generateTotpForStep(base32Secret, currentStep + offset);
            if (MessageDigest.isEqual(
                    expected.getBytes(StandardCharsets.UTF_8),
                    code.trim().getBytes(StandardCharsets.UTF_8))) {
                return true;
            }
        }
        return false;
    }

    public String generateTotpForStep(String base32Secret, long timeStep) {
        try {
            byte[] keyBytes = base32Decode(base32Secret);
            byte[] stepBytes = ByteBuffer.allocate(8).putLong(timeStep).array();
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(keyBytes, "HmacSHA1"));
            byte[] hash = mac.doFinal(stepBytes);

            int offset = hash[hash.length - 1] & 0x0F;
            int binary = ((hash[offset] & 0x7F) << 24)
                    | ((hash[offset + 1] & 0xFF) << 16)
                    | ((hash[offset + 2] & 0xFF) << 8)
                    | (hash[offset + 3] & 0xFF);
            int otp = binary % 1_000_000;
            return String.format("%06d", otp);
        } catch (Exception e) {
            throw new IllegalStateException("TOTP calculation failed", e);
        }
    }

    public String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        String[] parts = email.split("@", 2);
        String local = parts[0];
        String maskedLocal = local.length() <= 2
                ? local.charAt(0) + "***"
                : local.substring(0, 2) + "***" + local.charAt(local.length() - 1);
        return maskedLocal + "@" + parts[1];
    }

    private String base32Encode(byte[] data) {
        StringBuilder result = new StringBuilder();
        int buffer = 0;
        int bitsLeft = 0;
        for (byte b : data) {
            buffer = (buffer << 8) | (b & 0xFF);
            bitsLeft += 8;
            while (bitsLeft >= 5) {
                result.append(BASE32_CHARS.charAt((buffer >> (bitsLeft - 5)) & 0x1F));
                bitsLeft -= 5;
            }
        }
        if (bitsLeft > 0) {
            result.append(BASE32_CHARS.charAt((buffer << (5 - bitsLeft)) & 0x1F));
        }
        return result.toString();
    }

    private byte[] base32Decode(String base32) {
        String clean = base32.trim().replace("=", "").toUpperCase();
        byte[] out = new byte[(clean.length() * 5) / 8];
        int buffer = 0;
        int bitsLeft = 0;
        int index = 0;
        for (char c : clean.toCharArray()) {
            int val = BASE32_CHARS.indexOf(c);
            if (val < 0) continue;
            buffer = (buffer << 5) | val;
            bitsLeft += 5;
            if (bitsLeft >= 8) {
                out[index++] = (byte) ((buffer >> (bitsLeft - 8)) & 0xFF);
                bitsLeft -= 8;
            }
        }
        return out;
    }
}
