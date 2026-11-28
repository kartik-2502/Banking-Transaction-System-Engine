package com.bank.transaction.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "loan_repayment_schedules")
public class LoanRepaymentSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "loan_id", nullable = false)
    private Loan loan;

    @Column(name = "installment_number", nullable = false)
    private Integer installmentNumber;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "principal_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal principalAmount;

    @Column(name = "interest_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal interestAmount;

    @Column(name = "total_installment", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalInstallment;

    @Column(name = "paid_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "paid_date")
    private OffsetDateTime paidDate;

    @Column(nullable = false, length = 20)
    private String status = "PENDING"; // PENDING, UPCOMING, DUE, PAID, PARTIALLY_PAID, OVERDUE, WAIVED

    @Column(name = "waived_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal waivedAmount = BigDecimal.ZERO;

    @Column(name = "last_payment_ref", length = 64)
    private String lastPaymentRef;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public LoanRepaymentSchedule() {}

    public LoanRepaymentSchedule(Loan loan, Integer installmentNumber, LocalDate dueDate,
                                 BigDecimal principalAmount, BigDecimal interestAmount, BigDecimal totalInstallment) {
        this.loan = loan;
        this.installmentNumber = installmentNumber;
        this.dueDate = dueDate;
        this.principalAmount = principalAmount.setScale(2, java.math.RoundingMode.HALF_UP);
        this.interestAmount = interestAmount.setScale(2, java.math.RoundingMode.HALF_UP);
        this.totalInstallment = totalInstallment.setScale(2, java.math.RoundingMode.HALF_UP);
        this.status = "PENDING";
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Loan getLoan() {
        return loan;
    }

    public void setLoan(Loan loan) {
        this.loan = loan;
    }

    public Integer getInstallmentNumber() {
        return installmentNumber;
    }

    public void setInstallmentNumber(Integer installmentNumber) {
        this.installmentNumber = installmentNumber;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public BigDecimal getPrincipalAmount() {
        return principalAmount;
    }

    public void setPrincipalAmount(BigDecimal principalAmount) {
        this.principalAmount = principalAmount;
    }

    public BigDecimal getInterestAmount() {
        return interestAmount;
    }

    public void setInterestAmount(BigDecimal interestAmount) {
        this.interestAmount = interestAmount;
    }

    public BigDecimal getTotalInstallment() {
        return totalInstallment;
    }

    public void setTotalInstallment(BigDecimal totalInstallment) {
        this.totalInstallment = totalInstallment;
    }

    public BigDecimal getPaidAmount() {
        return paidAmount;
    }

    public void setPaidAmount(BigDecimal paidAmount) {
        this.paidAmount = paidAmount;
    }

    public OffsetDateTime getPaidDate() {
        return paidDate;
    }

    public void setPaidDate(OffsetDateTime paidDate) {
        this.paidDate = paidDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public BigDecimal getWaivedAmount() { return waivedAmount; }
    public void setWaivedAmount(BigDecimal waivedAmount) { this.waivedAmount = waivedAmount; }
    public String getLastPaymentRef() { return lastPaymentRef; }
    public void setLastPaymentRef(String lastPaymentRef) { this.lastPaymentRef = lastPaymentRef; }
}
