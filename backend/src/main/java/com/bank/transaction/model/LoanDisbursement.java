package com.bank.transaction.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "loan_disbursements")
public class LoanDisbursement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "disbursement_id", nullable = false, unique = true, length = 64)
    private String disbursementId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "loan_id", nullable = false)
    private Loan loan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "disbursement_mode", nullable = false, length = 40)
    private String disbursementMode = "CORE_LEDGER_SIMULATED";

    @Column(name = "transaction_ref", length = 64)
    private String transactionRef;

    @Column(name = "conditions_verified", nullable = false)
    private boolean conditionsVerified;

    @Column(name = "beneficiary_verified", nullable = false)
    private boolean beneficiaryVerified;

    @Column(nullable = false, length = 30)
    private String status = "INITIATED";

    @Column(name = "initiated_by", nullable = false, length = 50)
    private String initiatedBy;

    @Column(name = "approved_by", length = 50)
    private String approvedBy;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "disbursed_at")
    private OffsetDateTime disbursedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public Long getId() { return id; }
    public String getDisbursementId() { return disbursementId; }
    public void setDisbursementId(String disbursementId) { this.disbursementId = disbursementId; }
    public Loan getLoan() { return loan; }
    public void setLoan(Loan loan) { this.loan = loan; }
    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }
    public Account getAccount() { return account; }
    public void setAccount(Account account) { this.account = account; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getDisbursementMode() { return disbursementMode; }
    public void setDisbursementMode(String disbursementMode) { this.disbursementMode = disbursementMode; }
    public String getTransactionRef() { return transactionRef; }
    public void setTransactionRef(String transactionRef) { this.transactionRef = transactionRef; }
    public boolean isConditionsVerified() { return conditionsVerified; }
    public void setConditionsVerified(boolean conditionsVerified) { this.conditionsVerified = conditionsVerified; }
    public boolean isBeneficiaryVerified() { return beneficiaryVerified; }
    public void setBeneficiaryVerified(boolean beneficiaryVerified) { this.beneficiaryVerified = beneficiaryVerified; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getInitiatedBy() { return initiatedBy; }
    public void setInitiatedBy(String initiatedBy) { this.initiatedBy = initiatedBy; }
    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public OffsetDateTime getDisbursedAt() { return disbursedAt; }
    public void setDisbursedAt(OffsetDateTime disbursedAt) { this.disbursedAt = disbursedAt; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
