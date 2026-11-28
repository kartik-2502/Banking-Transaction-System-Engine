package com.bank.transaction.dto.loan;

import java.math.BigDecimal;
import java.util.List;

public class LoanOfficerProfileDto {
    private String username;
    private String email;
    private String employeeId;
    private String officerId;
    private String branchCode;
    private String branchName;
    private String department;
    private String employmentStatus;
    private String shiftStatus;
    private BigDecimal delegatedApprovalLimit;
    private long assignedApplicationsCount;
    private List<String> roles;
    private List<String> permissions;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
    public String getOfficerId() { return officerId; }
    public void setOfficerId(String officerId) { this.officerId = officerId; }
    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getEmploymentStatus() { return employmentStatus; }
    public void setEmploymentStatus(String employmentStatus) { this.employmentStatus = employmentStatus; }
    public String getShiftStatus() { return shiftStatus; }
    public void setShiftStatus(String shiftStatus) { this.shiftStatus = shiftStatus; }
    public BigDecimal getDelegatedApprovalLimit() { return delegatedApprovalLimit; }
    public void setDelegatedApprovalLimit(BigDecimal delegatedApprovalLimit) { this.delegatedApprovalLimit = delegatedApprovalLimit; }
    public long getAssignedApplicationsCount() { return assignedApplicationsCount; }
    public void setAssignedApplicationsCount(long assignedApplicationsCount) { this.assignedApplicationsCount = assignedApplicationsCount; }
    public List<String> getRoles() { return roles; }
    public void setRoles(List<String> roles) { this.roles = roles; }
    public List<String> getPermissions() { return permissions; }
    public void setPermissions(List<String> permissions) { this.permissions = permissions; }
}
