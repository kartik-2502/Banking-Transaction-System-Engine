package com.bank.transaction.controller;

import com.bank.transaction.dto.*;
import com.bank.transaction.model.ChallengeType;
import com.bank.transaction.service.AdaptiveMfaService;
import com.bank.transaction.service.CustomerService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;
    private final AdaptiveMfaService adaptiveMfaService;

    public CustomerController(CustomerService customerService,
                              AdaptiveMfaService adaptiveMfaService) {
        this.customerService = customerService;
        this.adaptiveMfaService = adaptiveMfaService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CustomerResponse>> createCustomer(@Valid @RequestBody CustomerCreateRequest request) {
        CustomerResponse response = customerService.createCustomer(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Customer profile created successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TELLER', 'LOAN_OFFICER')")
    public ResponseEntity<ApiResponse<Page<CustomerResponse>>> getAllCustomers(
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        Page<CustomerResponse> customers = customerService.getAllCustomers(pageable);
        return ResponseEntity.ok(ApiResponse.ok(customers));
    }

    @GetMapping("/{customerNumber}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TELLER', 'CUSTOMER', 'LOAN_OFFICER')")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCustomerByNumber(
            @PathVariable("customerNumber") String customerNumber) {
        CustomerResponse response = customerService.getCustomerByCustomerNumber(customerNumber);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{customerNumber}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TELLER')")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateCustomer(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("customerNumber") String customerNumber,
            @Valid @RequestBody CustomerUpdateRequest request,
            HttpServletRequest httpRequest) {
        if (userDetails != null) {
            AdaptiveMfaService.ClientContext ctx = new AdaptiveMfaService.ClientContext(
                    httpRequest.getRemoteAddr(),
                    httpRequest.getHeader("User-Agent"),
                    httpRequest.getHeader("X-Device-Fingerprint"),
                    null, null, null, null
            );
            adaptiveMfaService.enforceSensitiveOperationVerification(
                    userDetails.getUsername(),
                    ChallengeType.CONTACT_CHANGE,
                    null,
                    null,
                    null,
                    customerNumber,
                    request.getChallengeId(),
                    true,
                    ctx
            );
        }
        CustomerResponse response = customerService.updateCustomer(customerNumber, request);
        return ResponseEntity.ok(ApiResponse.ok("Customer updated successfully", response));
    }

    @GetMapping("/{customerNumber}/accounts")
    @PreAuthorize("hasAnyRole('ADMIN', 'TELLER', 'CUSTOMER', 'LOAN_OFFICER')")
    public ResponseEntity<ApiResponse<List<AccountResponse>>> getCustomerAccounts(
            @PathVariable("customerNumber") String customerNumber) {
        List<AccountResponse> accounts = customerService.getCustomerAccounts(customerNumber);
        return ResponseEntity.ok(ApiResponse.ok(accounts));
    }
}
