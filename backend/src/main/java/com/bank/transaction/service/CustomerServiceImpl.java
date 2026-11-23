package com.bank.transaction.service;

import com.bank.transaction.dto.AccountResponse;
import com.bank.transaction.dto.CustomerCreateRequest;
import com.bank.transaction.dto.CustomerResponse;
import com.bank.transaction.dto.CustomerUpdateRequest;
import com.bank.transaction.exception.CustomerNotFoundException;
import com.bank.transaction.exception.DuplicateResourceException;
import com.bank.transaction.model.Account;
import com.bank.transaction.model.Customer;
import com.bank.transaction.model.User;
import com.bank.transaction.repository.AccountRepository;
import com.bank.transaction.repository.CustomerRepository;
import com.bank.transaction.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CustomerServiceImpl implements CustomerService {

    private static final Logger log = LoggerFactory.getLogger(CustomerServiceImpl.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final CustomerRepository customerRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    public CustomerServiceImpl(CustomerRepository customerRepository,
                               AccountRepository accountRepository,
                               UserRepository userRepository) {
        this.customerRepository = customerRepository;
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
    }

    @Override
    public CustomerResponse createCustomer(CustomerCreateRequest request) {
        log.info("Creating new customer with email: {}", request.getEmail());

        if (customerRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Customer with email '" + request.getEmail() + "' already exists");
        }

        String customerNumber = generateUniqueCustomerNumber();
        Customer customer = new Customer(
                customerNumber,
                request.getFirstName(),
                request.getLastName(),
                request.getEmail(),
                request.getPhone(),
                request.getAddress()
        );

        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElse(null);
            customer.setUser(user);
        }

        Customer savedCustomer = customerRepository.save(customer);
        log.info("Customer created successfully: ID={}, CustomerNumber={}", savedCustomer.getId(), savedCustomer.getCustomerNumber());
        return mapToResponse(savedCustomer);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerResponse getCustomerByCustomerNumber(String customerNumber) {
        Customer customer = customerRepository.findByCustomerNumberWithAccounts(customerNumber)
                .orElseThrow(() -> new CustomerNotFoundException("Customer not found with number: " + customerNumber));
        return mapToResponse(customer);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerResponse getCustomerById(Long id) {
        Customer customer = customerRepository.findByIdWithAccounts(id)
                .orElseThrow(() -> new CustomerNotFoundException("Customer not found with ID: " + id));
        return mapToResponse(customer);
    }

    @Override
    public CustomerResponse updateCustomer(String customerNumber, CustomerUpdateRequest request) {
        log.info("Updating customer details for: {}", customerNumber);
        Customer customer = customerRepository.findByCustomerNumber(customerNumber)
                .orElseThrow(() -> new CustomerNotFoundException("Customer not found with number: " + customerNumber));

        customer.setFirstName(request.getFirstName());
        customer.setLastName(request.getLastName());
        customer.setPhone(request.getPhone());
        customer.setAddress(request.getAddress());

        Customer updatedCustomer = customerRepository.save(customer);
        return mapToResponse(updatedCustomer);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CustomerResponse> getAllCustomers(Pageable pageable) {
        return customerRepository.findAll(pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AccountResponse> getCustomerAccounts(String customerNumber) {
        Customer customer = customerRepository.findByCustomerNumber(customerNumber)
                .orElseThrow(() -> new CustomerNotFoundException("Customer not found with number: " + customerNumber));

        List<Account> accounts = accountRepository.findByCustomerId(customer.getId());
        return accounts.stream()
                .map(acc -> mapAccountToResponse(acc, customer))
                .collect(Collectors.toList());
    }

    private String generateUniqueCustomerNumber() {
        String customerNumber;
        do {
            int randomNum = 1000 + RANDOM.nextInt(9000);
            customerNumber = "CUST" + randomNum;
        } while (customerRepository.existsByCustomerNumber(customerNumber));
        return customerNumber;
    }

    private CustomerResponse mapToResponse(Customer customer) {
        CustomerResponse response = new CustomerResponse();
        response.setId(customer.getId());
        response.setCustomerNumber(customer.getCustomerNumber());
        response.setFirstName(customer.getFirstName());
        response.setLastName(customer.getLastName());
        response.setEmail(customer.getEmail());
        response.setPhone(customer.getPhone());
        response.setAddress(customer.getAddress());
        if (customer.getUser() != null) {
            response.setUserId(customer.getUser().getId());
        }
        response.setCreatedAt(customer.getCreatedAt());

        if (customer.getAccounts() != null) {
            response.setAccounts(customer.getAccounts().stream()
                    .map(acc -> mapAccountToResponse(acc, customer))
                    .collect(Collectors.toList()));
        }
        return response;
    }

    private AccountResponse mapAccountToResponse(Account account, Customer customer) {
        AccountResponse response = new AccountResponse();
        response.setId(account.getId());
        response.setAccountNumber(account.getAccountNumber());
        response.setCustomerNumber(customer != null ? customer.getCustomerNumber() : null);
        response.setCustomerName(customer != null ? (customer.getFirstName() + " " + customer.getLastName()) : null);
        response.setBalance(account.getBalance());
        response.setCurrency(account.getCurrency());
        response.setStatus(account.getStatus());
        response.setVersion(account.getVersion());
        response.setCreatedAt(account.getCreatedAt());
        return response;
    }
}
