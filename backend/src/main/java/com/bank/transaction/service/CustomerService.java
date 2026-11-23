package com.bank.transaction.service;

import com.bank.transaction.dto.AccountResponse;
import com.bank.transaction.dto.CustomerCreateRequest;
import com.bank.transaction.dto.CustomerResponse;
import com.bank.transaction.dto.CustomerUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CustomerService {
    CustomerResponse createCustomer(CustomerCreateRequest request);
    CustomerResponse getCustomerByCustomerNumber(String customerNumber);
    CustomerResponse getCustomerById(Long id);
    CustomerResponse updateCustomer(String customerNumber, CustomerUpdateRequest request);
    Page<CustomerResponse> getAllCustomers(Pageable pageable);
    List<AccountResponse> getCustomerAccounts(String customerNumber);
}
