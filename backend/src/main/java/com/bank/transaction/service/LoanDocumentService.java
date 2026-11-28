package com.bank.transaction.service;

import com.bank.transaction.dto.NotificationEvent;
import com.bank.transaction.dto.loan.LoanDocumentDto;
import com.bank.transaction.exception.InvalidTransactionException;
import com.bank.transaction.model.Loan;
import com.bank.transaction.model.LoanDocument;
import com.bank.transaction.model.LoanDocumentVerification;
import com.bank.transaction.model.User;
import com.bank.transaction.repository.LoanDocumentRepository;
import com.bank.transaction.repository.LoanDocumentVerificationRepository;
import com.bank.transaction.repository.LoanRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class LoanDocumentService {

    private static final Set<String> ALLOWED_STATUSES = Set.of(
            "PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED", "EXPIRED", "RESUBMISSION_REQUIRED"
    );

    private final Path storageRoot;
    private final LoanRepository loanRepository;
    private final LoanDocumentRepository documentRepository;
    private final LoanDocumentVerificationRepository verificationRepository;
    private final LoanAccessService accessService;
    private final OutboxService outboxService;

    public LoanDocumentService(
            @Value("${app.loan.documents-dir:uploads/loan-docs}") String documentsDir,
            LoanRepository loanRepository,
            LoanDocumentRepository documentRepository,
            LoanDocumentVerificationRepository verificationRepository,
            LoanAccessService accessService,
            OutboxService outboxService) {
        this.storageRoot = Paths.get(documentsDir).toAbsolutePath().normalize();
        this.loanRepository = loanRepository;
        this.documentRepository = documentRepository;
        this.verificationRepository = verificationRepository;
        this.accessService = accessService;
        this.outboxService = outboxService;
    }

    @Transactional
    public LoanDocumentDto uploadDocument(String username, String loanId, String documentType,
                                          MultipartFile file, LocalDate expiryDate, String remarks) {
        Loan loan = loanRepository.findByLoanId(loanId)
                .orElseThrow(() -> new InvalidTransactionException("Loan not found: " + loanId));
        User actor = accessService.getUser(username);
        if (accessService.hasRole(actor, com.bank.transaction.model.RoleName.CUSTOMER)) {
            if (loan.getCustomer().getUser() == null || !loan.getCustomer().getUser().getId().equals(actor.getId())) {
                throw new AccessDeniedException("Customer can only upload documents for their own loan applications");
            }
        } else {
            accessService.assertLoanAccess(username, loan);
        }

        if (file == null || file.isEmpty()) {
            throw new InvalidTransactionException("Uploaded document file cannot be empty");
        }
        String originalName = Paths.get(file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.pdf")
                .getFileName().toString().replaceAll("[^a-zA-Z0-9._-]", "_");

        String docId = "DOC_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
        String storedFileName = docId + "_" + originalName;
        Path loanDir = storageRoot.resolve(loan.getLoanId()).normalize();
        if (!loanDir.startsWith(storageRoot)) {
            throw new InvalidTransactionException("Invalid document storage path");
        }

        try {
            Files.createDirectories(loanDir);
            Path targetPath = loanDir.resolve(storedFileName).normalize();
            if (!targetPath.startsWith(loanDir)) {
                throw new InvalidTransactionException("Invalid file name");
            }
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            LoanDocument doc = new LoanDocument();
            doc.setDocumentId(docId);
            doc.setLoan(loan);
            doc.setDocumentType(documentType.trim().toUpperCase());
            doc.setFileName(originalName);
            doc.setContentType(file.getContentType() != null ? file.getContentType() : "application/octet-stream");
            doc.setFileSize(file.getSize());
            doc.setStoragePath(targetPath.toString());
            doc.setVerificationStatus("PENDING");
            doc.setExpiryDate(expiryDate);
            doc.setRemarks(remarks);
            doc.setUploadedBy(username);
            LoanDocument saved = documentRepository.save(doc);

            accessService.recordAudit(loan, username, "DOCUMENT_UPLOADED", "LOAN_DOCUMENT",
                    saved.getDocumentId(), null, "PENDING", "Uploaded " + saved.getDocumentType() + ": " + originalName);

            return mapDocument(saved, true);
        } catch (IOException ex) {
            throw new InvalidTransactionException("Failed to store loan document: " + ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Page<LoanDocumentDto> listDocuments(String username, String status, Pageable pageable) {
        Long branchId = accessService.resolveBranchScopeId(username);
        User actor = accessService.getUser(username);
        String officerScope = accessService.hasAnyRole(actor,
                com.bank.transaction.model.RoleName.ADMIN,
                com.bank.transaction.model.RoleName.BANK_MANAGER,
                com.bank.transaction.model.RoleName.AUDITOR) ? null : null;
        return documentRepository.findByBranchAndOptionalStatus(branchId, status, officerScope, pageable)
                .map(d -> mapDocument(d, false));
    }

    @Transactional(readOnly = true)
    public List<LoanDocumentDto> listDocumentsForLoan(String username, String loanId) {
        Loan loan = loanRepository.findByLoanId(loanId)
                .orElseThrow(() -> new InvalidTransactionException("Loan not found: " + loanId));
        accessService.assertLoanAccess(username, loan);
        return documentRepository.findByLoanIdOrderByCreatedAtDesc(loan.getId()).stream()
                .map(d -> mapDocument(d, true))
                .collect(Collectors.toList());
    }

    @Transactional
    public LoanDocumentDto verifyOrRejectDocument(String username, String documentId, LoanDocumentDto.VerifyDecisionRequest req) {
        LoanDocument doc = documentRepository.findByDocumentId(documentId)
                .orElseThrow(() -> new InvalidTransactionException("Document not found: " + documentId));
        accessService.assertLoanAccess(username, doc.getLoan());

        String targetStatus = req.getStatus().trim().toUpperCase();
        if (!ALLOWED_STATUSES.contains(targetStatus)) {
            throw new InvalidTransactionException("Unsupported document status: " + targetStatus);
        }
        if (("REJECTED".equals(targetStatus) || "RESUBMISSION_REQUIRED".equals(targetStatus))
                && (req.getRejectionReason() == null || req.getRejectionReason().isBlank())) {
            throw new InvalidTransactionException("Rejection or resubmission reason is mandatory");
        }
        if ("VERIFIED".equals(targetStatus) && doc.getExpiryDate() != null && doc.getExpiryDate().isBefore(LocalDate.now())) {
            throw new InvalidTransactionException("Cannot verify an expired document (expired on " + doc.getExpiryDate() + ")");
        }

        String prevStatus = doc.getVerificationStatus();
        doc.setVerificationStatus(targetStatus);
        doc.setRemarks(req.getRemarks());
        doc.setRejectionReason(req.getRejectionReason());
        doc.setVerifiedBy(username);
        doc.setVerifiedAt(OffsetDateTime.now());
        LoanDocument saved = documentRepository.save(doc);

        LoanDocumentVerification verif = new LoanDocumentVerification();
        verif.setVerificationId("VER_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
        verif.setDocument(saved);
        verif.setLoan(saved.getLoan());
        verif.setPreviousStatus(prevStatus);
        verif.setNewStatus(targetStatus);
        verif.setVerifiedBy(username);
        verif.setRemarks(req.getRemarks());
        verif.setRejectionReason(req.getRejectionReason());
        verificationRepository.save(verif);

        accessService.recordAudit(saved.getLoan(), username, "DOCUMENT_" + targetStatus, "LOAN_DOCUMENT",
                saved.getDocumentId(), prevStatus, targetStatus,
                req.getRejectionReason() != null ? req.getRejectionReason() : req.getRemarks());

        if ("REJECTED".equals(targetStatus) || "RESUBMISSION_REQUIRED".equals(targetStatus)) {
            User custUser = saved.getLoan().getCustomer().getUser();
            if (custUser != null) {
                outboxService.publishNotificationEvent(new NotificationEvent(
                        "LOAN_DOCUMENT_ACTION_REQUIRED",
                        saved.getLoan().getLoanId(),
                        saved.getLoan().getAccount().getAccountNumber(),
                        custUser.getId(),
                        custUser.getUsername(),
                        saved.getLoan().getAmount(),
                        "Loan Document Re-submission Required",
                        String.format("Document %s (%s) for loan %s marked %s: %s",
                                saved.getDocumentType(), saved.getDocumentId(), saved.getLoan().getLoanId(),
                                targetStatus, req.getRejectionReason()),
                        "WARNING"
                ));
            }
        }
        return mapDocument(saved, true);
    }

    @Transactional(readOnly = true)
    public DocumentResourceResult loadDocumentResource(String username, String documentId) {
        LoanDocument doc = documentRepository.findByDocumentId(documentId)
                .orElseThrow(() -> new InvalidTransactionException("Document not found: " + documentId));
        User actor = accessService.getUser(username);
        if (accessService.hasRole(actor, com.bank.transaction.model.RoleName.CUSTOMER)) {
            if (doc.getLoan().getCustomer().getUser() == null
                    || !doc.getLoan().getCustomer().getUser().getId().equals(actor.getId())) {
                throw new AccessDeniedException("Unauthorized access to loan document");
            }
        } else {
            accessService.assertLoanAccess(username, doc.getLoan());
        }

        try {
            Path path = Paths.get(doc.getStoragePath()).toAbsolutePath().normalize();
            if (!path.startsWith(storageRoot)) {
                throw new AccessDeniedException("Blocked unsafe document file path");
            }
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new InvalidTransactionException("Document content unavailable on disk for: " + documentId);
            }
            return new DocumentResourceResult(doc, resource);
        } catch (MalformedURLException ex) {
            throw new InvalidTransactionException("Malformed document path: " + documentId);
        }
    }

    private LoanDocumentDto mapDocument(LoanDocument d, boolean includeHistory) {
        LoanDocumentDto dto = new LoanDocumentDto();
        dto.setDocumentId(d.getDocumentId());
        dto.setLoanId(d.getLoan().getLoanId());
        dto.setCustomerNumber(d.getLoan().getCustomer().getCustomerNumber());
        dto.setCustomerName(d.getLoan().getCustomer().getFirstName() + " " + d.getLoan().getCustomer().getLastName());
        dto.setDocumentType(d.getDocumentType());
        dto.setFileName(d.getFileName());
        dto.setContentType(d.getContentType());
        dto.setFileSize(d.getFileSize());
        dto.setVerificationStatus(d.getVerificationStatus());
        dto.setExpiryDate(d.getExpiryDate());
        dto.setExpired(d.getExpiryDate() != null && d.getExpiryDate().isBefore(LocalDate.now()));
        dto.setRemarks(d.getRemarks());
        dto.setRejectionReason(d.getRejectionReason());
        dto.setUploadedBy(d.getUploadedBy());
        dto.setVerifiedBy(d.getVerifiedBy());
        dto.setVerifiedAt(d.getVerifiedAt());
        dto.setCreatedAt(d.getCreatedAt());
        if (includeHistory) {
            dto.setHistory(verificationRepository.findByDocumentIdOrderByVerifiedAtDesc(d.getId()).stream().map(v -> {
                LoanDocumentDto.VerificationRecord r = new LoanDocumentDto.VerificationRecord();
                r.setVerificationId(v.getVerificationId());
                r.setPreviousStatus(v.getPreviousStatus());
                r.setNewStatus(v.getNewStatus());
                r.setVerifiedBy(v.getVerifiedBy());
                r.setRemarks(v.getRemarks());
                r.setRejectionReason(v.getRejectionReason());
                r.setVerifiedAt(v.getVerifiedAt());
                return r;
            }).collect(Collectors.toList()));
        }
        return dto;
    }

    public record DocumentResourceResult(LoanDocument document, Resource resource) {}
}
