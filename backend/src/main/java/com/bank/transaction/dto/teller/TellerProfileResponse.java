package com.bank.transaction.dto.teller;

import java.math.BigDecimal;
import java.util.List;

public class TellerProfileResponse {
    private String username;
    private String email;
    private String employeeId;
    private String tellerId;
    private String branchCode;
    private String branchName;
    private String branchCity;
    private String ifscCode;
    private String drawerCode;
    private String employmentStatus;
    private String shiftStatus;
    private BigDecimal maxCashLimit;
    private List<String> roles;
    private List<String> permissions;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
    public String getTellerId() { return tellerId; }
    public void setTellerId(String tellerId) { this.tellerId = tellerId; }
    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
    public String getBranchCity() { return branchCity; }
    public void setBranchCity(String branchCity) { this.branchCity = branchCity; }
    public String getIfscCode() { return ifscCode; }
    public void setIfscCode(String ifscCode) { this.ifscCode = ifscCode; }
    public String getDrawerCode() { return drawerCode; }
    public void setDrawerCode(String drawerCode) { this.drawerCode = drawerCode; }
    public String getEmploymentStatus() { return employmentStatus; }
    public void setEmploymentStatus(String employmentStatus) { this.employmentStatus = employmentStatus; }
    public String getShiftStatus() { return shiftStatus; }
    public void setShiftStatus(String shiftStatus) { this.shiftStatus = shiftStatus; }
    public BigDecimal getMaxCashLimit() { return maxCashLimit; }
    public void setMaxCashLimit(BigDecimal maxCashLimit) { this.maxCashLimit = maxCashLimit; }
    public List<String> getRoles() { return roles; }
    public void setRoles(List<String> roles) { this.roles = roles; }
    public List<String> getPermissions() { return permissions; }
    public void setPermissions(List<String> permissions) { this.permissions = permissions; }
}
