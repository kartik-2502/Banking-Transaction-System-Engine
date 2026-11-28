package com.bank.transaction.dto.teller;

import com.bank.transaction.dto.AccountResponse;
import java.util.List;

public class TellerCustomerSummaryResponse {
    private Long id;
    private String customerNumber;
    private String fullName;
    private String firstName;
    private String lastName;
    private String maskedEmail;
    private String maskedPhone;
    private String address;
    private String branchCode;
    private String branchName;
    private String kycStatus;
    private List<AccountResponse> accounts;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCustomerNumber() { return customerNumber; }
    public void setCustomerNumber(String customerNumber) { this.customerNumber = customerNumber; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getMaskedEmail() { return maskedEmail; }
    public void setMaskedEmail(String maskedEmail) { this.maskedEmail = maskedEmail; }
    public String getMaskedPhone() { return maskedPhone; }
    public void setMaskedPhone(String maskedPhone) { this.maskedPhone = maskedPhone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
    public String getKycStatus() { return kycStatus; }
    public void setKycStatus(String kycStatus) { this.kycStatus = kycStatus; }
    public List<AccountResponse> getAccounts() { return accounts; }
    public void setAccounts(List<AccountResponse> accounts) { this.accounts = accounts; }
}
