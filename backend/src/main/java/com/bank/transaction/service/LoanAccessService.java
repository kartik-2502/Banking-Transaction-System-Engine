package com.bank.transaction.service;

import com.bank.transaction.dto.loan.LoanOfficerProfileDto;
import com.bank.transaction.exception.CustomerNotFoundException;
import com.bank.transaction.exception.InvalidTransactionException;
import com.bank.transaction.model.*;
import com.bank.transaction.repository.BranchRepository;
import com.bank.transaction.repository.LoanAuditLogRepository;
import com.bank.transaction.repository.LoanOfficerProfileRepository;
import com.bank.transaction.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class LoanAccessService {

    private final LoanOfficerProfileRepository officerProfileRepository;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final LoanAuditLogRepository auditLogRepository;

    public LoanAccessService(LoanOfficerProfileRepository officerProfileRepository,
                             UserRepository userRepository,
                             BranchRepository branchRepository,
                             LoanAuditLogRepository auditLogRepository) {
        this.officerProfileRepository = officerProfileRepository;
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(readOnly = true)
    public User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new CustomerNotFoundException("Authenticated user not found: " + username));
    }

    @Transactional(readOnly = true)
    public LoanOfficerProfile requireOfficerProfile(String username) {
        return officerProfileRepository.findByUsernameWithDetails(username)
                .orElseGet(() -> buildSupervisorFallbackProfile(username));
    }

    private LoanOfficerProfile buildSupervisorFallbackProfile(String username) {
        User user = getUser(username);
        if (hasAnyRole(user, RoleName.ADMIN, RoleName.BANK_MANAGER, RoleName.AUDITOR)) {
            Branch defaultBranch = branchRepository.findByBranchCode("BR001")
                    .orElseThrow(() -> new InvalidTransactionException("Default branch BR001 not initialized"));
            LoanOfficerProfile p = new LoanOfficerProfile();
            p.setUser(user);
            p.setBranch(defaultBranch);
            p.setEmployeeId("EMP-" + user.getId());
            p.setOfficerId("SUP-" + user.getId());
            p.setDepartment("Credit Governance & Supervision");
            p.setEmploymentStatus("ACTIVE");
            p.setShiftStatus("ON_SHIFT");
            p.setDelegatedApprovalLimit(new BigDecimal("10000000.00"));
            return p;
        }
        throw new AccessDeniedException("User '" + username + "' does not hold an active Loan Officer branch assignment");
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
        return requireOfficerProfile(username).getBranch().getId();
    }

    public void assertBranchAccess(String username, Branch targetBranch) {
        User user = getUser(username);
        if (isCrossBranchAuthorized(user) || targetBranch == null) {
            return;
        }
        Branch officerBranch = requireOfficerProfile(username).getBranch();
        if (!officerBranch.getId().equals(targetBranch.getId())) {
            throw new AccessDeniedException(
                    "Branch isolation violation: Officer assigned to " + officerBranch.getBranchCode()
                            + " cannot access records from " + targetBranch.getBranchCode());
        }
    }

    public void assertLoanAccess(String username, Loan loan) {
        Branch branch = loan.getBranch() != null
                ? loan.getBranch()
                : (loan.getCustomer() != null ? loan.getCustomer().getBranch() : null);
        assertBranchAccess(username, branch);

        User user = getUser(username);
        if (hasAnyRole(user, RoleName.ADMIN, RoleName.BANK_MANAGER, RoleName.AUDITOR)) {
            return;
        }
        if (loan.getAssignedOfficer() != null && !loan.getAssignedOfficer().isBlank()
                && !loan.getAssignedOfficer().equalsIgnoreCase(username)) {
            throw new AccessDeniedException(
                    "Application assignment restriction: Loan " + loan.getLoanId()
                            + " is currently assigned to " + loan.getAssignedOfficer());
        }
    }

    public void assertNotSelfApproval(String makerUsername, String checkerUsername, String actionLabel) {
        if (makerUsername != null && makerUsername.equalsIgnoreCase(checkerUsername)) {
            throw new AccessDeniedException(
                    "Maker-checker violation: User '" + checkerUsername + "' cannot self-approve their own " + actionLabel);
        }
    }

    public LoanOfficerProfileDto buildProfileDto(String username, long assignedCount) {
        User user = getUser(username);
        LoanOfficerProfile p = requireOfficerProfile(username);
        LoanOfficerProfileDto dto = new LoanOfficerProfileDto();
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setEmployeeId(p.getEmployeeId());
        dto.setOfficerId(p.getOfficerId());
        dto.setBranchCode(p.getBranch().getBranchCode());
        dto.setBranchName(p.getBranch().getBranchName());
        dto.setDepartment(p.getDepartment());
        dto.setEmploymentStatus(p.getEmploymentStatus());
        dto.setShiftStatus(p.getShiftStatus());
        dto.setDelegatedApprovalLimit(p.getDelegatedApprovalLimit());
        dto.setAssignedApplicationsCount(assignedCount);
        dto.setRoles(user.getRoles().stream().map(r -> r.getName().name()).collect(Collectors.toList()));
        List<String> perms = user.getRoles().stream()
                .flatMap(r -> r.getPermissions().stream())
                .map(Permission::getName)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
        dto.setPermissions(perms);
        return dto;
    }

    public void recordAudit(Loan loan, String username, String action, String entityType,
                            String entityRef, String prevState, String newState, String remarks) {
        User user = userRepository.findByUsername(username).orElse(null);
        String empId = officerProfileRepository.findByUsernameWithDetails(username)
                .map(LoanOfficerProfile::getEmployeeId)
                .orElse(user != null ? "EMP-" + user.getId() : null);

        LoanAuditLog log = new LoanAuditLog();
        log.setAuditId("LAUD_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
        log.setLoan(loan);
        log.setUserId(user != null ? user.getId() : null);
        log.setUsername(username);
        log.setEmployeeId(empId);
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityRef(entityRef);
        log.setPreviousState(prevState);
        log.setNewState(newState);
        log.setRemarks(remarks);
        auditLogRepository.save(log);
    }

    public String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) return "****";
        return "******" + phone.substring(phone.length() - 4);
    }

    public String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***@***";
        int idx = email.indexOf('@');
        return (idx <= 2 ? email.charAt(0) + "***" : email.substring(0, 2) + "***") + email.substring(idx);
    }
}
