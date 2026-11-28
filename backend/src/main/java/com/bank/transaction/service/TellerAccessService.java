package com.bank.transaction.service;

import com.bank.transaction.dto.AccountResponse;
import com.bank.transaction.dto.teller.TellerProfileResponse;
import com.bank.transaction.exception.CustomerNotFoundException;
import com.bank.transaction.exception.InvalidTransactionException;
import com.bank.transaction.model.*;
import com.bank.transaction.repository.BranchRepository;
import com.bank.transaction.repository.TellerProfileRepository;
import com.bank.transaction.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TellerAccessService {

    private final TellerProfileRepository tellerProfileRepository;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;

    public TellerAccessService(TellerProfileRepository tellerProfileRepository,
                               UserRepository userRepository,
                               BranchRepository branchRepository) {
        this.tellerProfileRepository = tellerProfileRepository;
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
    }

    @Transactional(readOnly = true)
    public User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new CustomerNotFoundException("Authenticated user not found: " + username));
    }

    @Transactional(readOnly = true)
    public TellerProfile requireStaffProfile(String username) {
        return tellerProfileRepository.findByUsernameWithDetails(username)
                .orElseGet(() -> buildFallbackAdminProfileIfAuthorized(username));
    }

    private TellerProfile buildFallbackAdminProfileIfAuthorized(String username) {
        User user = getUser(username);
        if (hasAnyRole(user, RoleName.ADMIN, RoleName.BANK_MANAGER, RoleName.AUDITOR, RoleName.RISK_ANALYST)) {
            Branch defaultBranch = branchRepository.findByBranchCode("BR001")
                    .orElseThrow(() -> new InvalidTransactionException("Default branch BR001 not initialized"));
            TellerProfile virtual = new TellerProfile();
            virtual.setUser(user);
            virtual.setBranch(defaultBranch);
            virtual.setEmployeeId("EMP-" + user.getId());
            virtual.setTellerId("STAFF-" + user.getId());
            virtual.setDrawerCode("VAULT-BR001");
            virtual.setEmploymentStatus("ACTIVE");
            virtual.setShiftStatus("ON_SHIFT");
            return virtual;
        }
        throw new AccessDeniedException("User '" + username + "' does not have an assigned branch teller profile");
    }

    public boolean hasRole(User user, RoleName roleName) {
        return user.getRoles().stream().anyMatch(r -> r.getName() == roleName);
    }

    public boolean hasAnyRole(User user, RoleName... roles) {
        for (RoleName role : roles) {
            if (hasRole(user, role)) {
                return true;
            }
        }
        return false;
    }

    public boolean isCrossBranchAuthorized(User user) {
        return hasAnyRole(user, RoleName.ADMIN, RoleName.AUDITOR);
    }

    public Long resolveBranchScopeId(String username) {
        User user = getUser(username);
        if (isCrossBranchAuthorized(user)) {
            return null;
        }
        return requireStaffProfile(username).getBranch().getId();
    }

    public void assertBranchAccess(String username, Branch targetBranch) {
        User user = getUser(username);
        if (isCrossBranchAuthorized(user) || targetBranch == null) {
            return;
        }
        TellerProfile profile = requireStaffProfile(username);
        if (!profile.getBranch().getId().equals(targetBranch.getId())) {
            throw new AccessDeniedException(
                    "Branch isolation violation: Staff assigned to branch " + profile.getBranch().getBranchCode()
                            + " cannot access records from branch " + targetBranch.getBranchCode()
            );
        }
    }

    public void assertNotSelfApproval(String requester, String reviewer, String actionLabel) {
        if (requester != null && requester.equalsIgnoreCase(reviewer)) {
            throw new InvalidTransactionException(
                    "Segregation of Duties violation: You cannot approve or verify your own " + actionLabel
            );
        }
    }

    @Transactional(readOnly = true)
    public TellerProfileResponse getProfileResponse(String username) {
        User user = getUser(username);
        TellerProfile profile = requireStaffProfile(username);

        TellerProfileResponse res = new TellerProfileResponse();
        res.setUsername(user.getUsername());
        res.setEmail(user.getEmail());
        res.setEmployeeId(profile.getEmployeeId());
        res.setTellerId(profile.getTellerId());
        res.setBranchCode(profile.getBranch().getBranchCode());
        res.setBranchName(profile.getBranch().getBranchName());
        res.setBranchCity(profile.getBranch().getCity());
        res.setIfscCode(profile.getBranch().getIfscCode());
        res.setDrawerCode(profile.getDrawerCode());
        res.setEmploymentStatus(profile.getEmploymentStatus());
        res.setShiftStatus(profile.getShiftStatus());
        res.setMaxCashLimit(profile.getMaxCashLimit());
        res.setRoles(user.getRoles().stream().map(r -> r.getName().name()).collect(Collectors.toList()));
        res.setPermissions(user.getRoles().stream()
                .flatMap(r -> r.getPermissions().stream())
                .map(Permission::getName)
                .distinct()
                .sorted()
                .collect(Collectors.toList()));
        return res;
    }

    public AccountResponse mapAccountSummary(Account acc) {
        AccountResponse res = new AccountResponse();
        res.setId(acc.getId());
        res.setAccountNumber(acc.getAccountNumber());
        res.setCustomerNumber(acc.getCustomer().getCustomerNumber());
        res.setCustomerName(acc.getCustomer().getFirstName() + " " + acc.getCustomer().getLastName());
        res.setBalance(acc.getBalance());
        res.setCurrency(acc.getCurrency());
        res.setStatus(acc.getStatus());
        res.setVersion(acc.getVersion());
        res.setCreatedAt(acc.getCreatedAt());
        return res;
    }

    public String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) return "****";
        return phone.substring(0, Math.min(4, phone.length())) + "****" + phone.substring(phone.length() - 2);
    }

    public String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        String[] parts = email.split("@", 2);
        String local = parts[0];
        String prefix = local.length() <= 2 ? local : local.substring(0, 2);
        return prefix + "***@" + parts[1];
    }
}
