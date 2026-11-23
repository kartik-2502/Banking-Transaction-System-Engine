package com.bank.transaction.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Objects;

@Entity
@Table(name = "account_transaction_limits")
public class AccountTransactionLimit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false, unique = true)
    private Account account;

    @Column(name = "daily_limit", nullable = false, precision = 15, scale = 2)
    private BigDecimal dailyLimit = new BigDecimal("100000.00");

    @Column(name = "per_transaction_limit", nullable = false, precision = 15, scale = 2)
    private BigDecimal perTransactionLimit = new BigDecimal("50000.00");

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public AccountTransactionLimit() {}

    public AccountTransactionLimit(Account account, BigDecimal dailyLimit, BigDecimal perTransactionLimit) {
        this.account = account;
        this.dailyLimit = dailyLimit != null ? dailyLimit.setScale(2, java.math.RoundingMode.HALF_UP) : new BigDecimal("100000.00");
        this.perTransactionLimit = perTransactionLimit != null ? perTransactionLimit.setScale(2, java.math.RoundingMode.HALF_UP) : new BigDecimal("50000.00");
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Account getAccount() {
        return account;
    }

    public void setAccount(Account account) {
        this.account = account;
    }

    public BigDecimal getDailyLimit() {
        return dailyLimit;
    }

    public void setDailyLimit(BigDecimal dailyLimit) {
        this.dailyLimit = dailyLimit != null ? dailyLimit.setScale(2, java.math.RoundingMode.HALF_UP) : dailyLimit;
    }

    public BigDecimal getPerTransactionLimit() {
        return perTransactionLimit;
    }

    public void setPerTransactionLimit(BigDecimal perTransactionLimit) {
        this.perTransactionLimit = perTransactionLimit != null ? perTransactionLimit.setScale(2, java.math.RoundingMode.HALF_UP) : perTransactionLimit;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AccountTransactionLimit that = (AccountTransactionLimit) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
