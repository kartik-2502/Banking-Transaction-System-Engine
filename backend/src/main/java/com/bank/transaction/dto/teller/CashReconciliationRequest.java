package com.bank.transaction.dto.teller;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class CashReconciliationRequest {
    @NotNull(message = "Declared physical cash amount is required")
    @DecimalMin(value = "0.00", message = "Declared cash cannot be negative")
    private BigDecimal declaredPhysicalCash;

    private String remarks;

    public BigDecimal getDeclaredPhysicalCash() { return declaredPhysicalCash; }
    public void setDeclaredPhysicalCash(BigDecimal declaredPhysicalCash) { this.declaredPhysicalCash = declaredPhysicalCash; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
