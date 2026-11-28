package com.bank.transaction.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "cheques")
public class Cheque {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cheque_ref", nullable = false, unique = true, length = 40)
    private String chequeRef;

    @Column(name = "cheque_number", nullable = false, length = 32)
    private String chequeNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(name = "drawer_account_number", length = 40)
    private String drawerAccountNumber;

    @Column(name = "issuing_bank_name", nullable = false, length = 120)
    private String issuingBankName;

    @Column(name = "issuing_branch", length = 120)
    private String issuingBranch;

    @Column(name = "cheque_date", nullable = false)
    private LocalDate chequeDate;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "request_type", nullable = false, length = 25)
    private String requestType = "DEPOSIT";

    @Column(nullable = false, length = 30)
    private String status = "RECEIVED";

    @Column(name = "attachment_ref", length = 255)
    private String attachmentRef;

    @Column(length = 500)
    private String remarks;

    @Column(name = "submitted_by", nullable = false, length = 50)
    private String submittedBy;

    @Column(name = "processed_by", length = 50)
    private String processedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @PreUpdate
    public void preUpdate() { this.updatedAt = OffsetDateTime.now(); }

    public Long getId() { return id; }
    public String getChequeRef() { return chequeRef; }
    public void setChequeRef(String chequeRef) { this.chequeRef = chequeRef; }
    public String getChequeNumber() { return chequeNumber; }
    public void setChequeNumber(String chequeNumber) { this.chequeNumber = chequeNumber; }
    public Account getAccount() { return account; }
    public void setAccount(Account account) { this.account = account; }
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }
    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }
    public String getDrawerAccountNumber() { return drawerAccountNumber; }
    public void setDrawerAccountNumber(String drawerAccountNumber) { this.drawerAccountNumber = drawerAccountNumber; }
    public String getIssuingBankName() { return issuingBankName; }
    public void setIssuingBankName(String issuingBankName) { this.issuingBankName = issuingBankName; }
    public String getIssuingBranch() { return issuingBranch; }
    public void setIssuingBranch(String issuingBranch) { this.issuingBranch = issuingBranch; }
    public LocalDate getChequeDate() { return chequeDate; }
    public void setChequeDate(LocalDate chequeDate) { this.chequeDate = chequeDate; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getRequestType() { return requestType; }
    public void setRequestType(String requestType) { this.requestType = requestType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getAttachmentRef() { return attachmentRef; }
    public void setAttachmentRef(String attachmentRef) { this.attachmentRef = attachmentRef; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(String submittedBy) { this.submittedBy = submittedBy; }
    public String getProcessedBy() { return processedBy; }
    public void setProcessedBy(String processedBy) { this.processedBy = processedBy; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
