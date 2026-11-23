package com.bank.transaction.controller;

import com.bank.transaction.dto.*;
import com.bank.transaction.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CustomerResponse>> createCustomer(@Valid @RequestBody CustomerCreateRequest request) {
        CustomerResponse response = customerService.createCustomer(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Customer profile created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CustomerResponse>>> getAllCustomers(
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        Page<CustomerResponse> customers = customerService.getAllCustomers(pageable);
        return ResponseEntity.ok(ApiResponse.ok(customers));
    }

    @GetMapping("/{customerNumber}")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCustomerByNumber(
            @PathVariable("customerNumber") String customerNumber) {
        CustomerResponse response = customerService.getCustomerByCustomerNumber(customerNumber);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{customerNumber}")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateCustomer(
            @PathVariable("customerNumber") String customerNumber,
            @Valid @RequestBody CustomerUpdateRequest request) {
        CustomerResponse response = customerService.updateCustomer(customerNumber, request);
        return ResponseEntity.ok(ApiResponse.ok("Customer updated successfully", response));
    }

    @GetMapping("/{customerNumber}/accounts")
    public ResponseEntity<ApiResponse<List<AccountResponse>>> getCustomerAccounts(
            @PathVariable("customerNumber") String customerNumber) {
        List<AccountResponse> accounts = customerService.getCustomerAccounts(customerNumber);
        return ResponseEntity.ok(ApiResponse.ok(accounts));
    }
}
