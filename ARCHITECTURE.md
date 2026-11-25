# Banking Transaction Processing System — Technical Architecture

This document provides a comprehensive technical architecture and design specification for the **Multi-Threaded Banking Transaction Processing System**, engineered as a final-year B.Tech capstone project.

---

## 1. System Topology & Architectural Overview

The application follows an enterprise-grade, tiered architecture prioritizing **strict ACID transaction isolation**, **high-concurrency throughput**, **deadlock-free deterministic locking**, **rule-based fraud surveillance**, and **event-driven client notifications**.

```mermaid
flowchart TD
    Client["Client Layer<br/>(React 18 / Vite / Tailwind SPA)"]
    
    subgraph Edge["Reverse Proxy & Gateway"]
        Nginx["Nginx Reverse Proxy & Static Server"]
    end
    
    subgraph Backend["Spring Boot 3 Core Engine (Java 17 LTS)"]
        SecFilter["Spring Security Filter Chain<br/>(JWT & RBAC Evaluation)"]
        RestControllers["REST Controllers<br/>(Accounts, Txns, Loans, Analytics, Fraud)"]
        TxnService["Transaction Service<br/>(SELECT FOR UPDATE Locking)"]
        IdemMgr["Idempotency Manager<br/>(Multi-Layer In-Flight & DB Check)"]
        FraudEngine["Fraud Detection Engine<br/>(Velocity, Spikes, Structuring)"]
        AuditService["Transaction Audit Service<br/>(MDC Traceability & Ledgers)"]
        OutboxPoller["Notification Outbox Processor<br/>(Transactional Outbox Poller)"]
        STOMPBroker["STOMP WebSocket Message Broker<br/>(/topic, /queue)"]
    end
    
    subgraph Storage["Persistence Layer (PostgreSQL 18.3)"]
        HikariPool["HikariCP Connection Pool<br/>(Max Pool: 30)"]
        PgDB[(PostgreSQL Database<br/>Flyway Managed Schema)]
    end

    Client -->|HTTP REST / WebSockets| Nginx
    Nginx -->|Proxy /api/| RestControllers
    Nginx -->|Proxy /ws/| STOMPBroker
    RestControllers --> SecFilter
    SecFilter --> TxnService
    TxnService --> IdemMgr
    TxnService --> FraudEngine
    TxnService --> AuditService
    TxnService --> OutboxPoller
    OutboxPoller --> STOMPBroker
    STOMPBroker -.->|Push Notifications| Client
    TxnService --> HikariPool
    HikariPool --> PgDB
```

---

## 2. Database Schema & Entity Relationship Diagram

The PostgreSQL schema is managed via Flyway versioned migrations (`V1__init_schema.sql`, `V2__loan_management.sql`, `V3__loan_officer_rbac.sql`) enforcing primary keys, foreign keys, constraints, and audit columns.

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : has
    ROLES ||--o{ USER_ROLES : assigned
    USERS ||--o| CUSTOMERS : maps_to
    CUSTOMERS ||--o{ ACCOUNTS : owns
    ACCOUNTS ||--o| ACCOUNT_TRANSACTION_LIMITS : constrained_by
    ACCOUNTS ||--o{ TRANSACTIONS : source_or_dest
    TRANSACTIONS ||--o| TRANSACTION_AUDITS : logs
    TRANSACTIONS ||--o| RISK_ASSESSMENTS : evaluated_as
    RISK_ASSESSMENTS ||--o| FRAUD_ALERTS : raises
    ACCOUNTS ||--o{ LOANS : disburse_target
    LOANS ||--o{ LOAN_REPAYMENT_SCHEDULES : amortized_by
    LOANS ||--o{ LOAN_STATUS_HISTORY : audited_by
    USERS ||--o{ USER_NOTIFICATIONS : receives

    USERS {
        bigint id PK
        varchar username UK
        varchar email UK
        varchar password_hash
        boolean enabled
        timestamp created_at
    }

    ROLES {
        bigint id PK
        varchar name UK
    }

    CUSTOMERS {
        bigint id PK
        varchar customer_number UK
        varchar first_name
        varchar last_name
        varchar email UK
        varchar phone
    }

    ACCOUNTS {
        bigint id PK
        varchar account_number UK
        bigint customer_id FK
        numeric balance
        varchar currency
        varchar status
        bigint version
        timestamp created_at
    }

    ACCOUNT_TRANSACTION_LIMITS {
        bigint id PK
        bigint account_id FK
        numeric daily_limit
        numeric per_transaction_limit
    }

    TRANSACTIONS {
        bigint id PK
        varchar transaction_id UK
        varchar transaction_type
        bigint source_account_id FK
        bigint destination_account_id FK
        numeric amount
        varchar status
        varchar failure_reason
        varchar initiated_by
        timestamp created_at
    }

    TRANSACTION_AUDITS {
        bigint id PK
        varchar transaction_id FK
        bigint account_id
        varchar thread_name
        varchar operation_type
        varchar result
        bigint duration_ms
        timestamp created_at
    }

    RISK_ASSESSMENTS {
        bigint id PK
        varchar transaction_id FK
        integer risk_score
        varchar risk_level
        varchar triggered_rules
        boolean recommended_block
    }

    FRAUD_ALERTS {
        bigint id PK
        varchar transaction_id FK
        bigint account_id
        integer risk_score
        varchar risk_level
        varchar status
        varchar reason
        varchar reviewed_by
    }

    NOTIFICATION_OUTBOX {
        bigint id PK
        varchar event_type
        text payload
        varchar status
        integer retry_count
        timestamp created_at
    }

    LOANS {
        bigint id PK
        varchar loan_id UK
        bigint customer_id FK
        bigint account_id FK
        numeric amount
        numeric interest_rate
        integer term_months
        varchar status
        varchar purpose
        numeric monthly_income
        numeric existing_monthly_debt
        integer credit_score
        numeric dti_ratio
        numeric emi_amount
        numeric total_payable
        numeric outstanding_balance
        boolean requires_admin_approval
        varchar reviewed_by
        varchar final_approved_by
    }

    LOAN_REPAYMENT_SCHEDULES {
        bigint id PK
        bigint loan_id FK
        integer installment_number
        date due_date
        numeric principal_amount
        numeric interest_amount
        numeric total_installment
        varchar status
    }

    LOAN_STATUS_HISTORY {
        bigint id PK
        bigint loan_id FK
        varchar previous_status
        varchar new_status
        varchar changed_by
        text remarks
        timestamp created_at
    }
```

---

## 3. Concurrency & Deadlock Prevention Model

### The Challenge: Circular Wait in Cross-Transfers
When two threads concurrently execute transfers between the same two accounts in opposing directions:
* **Thread A**: Transfer from Account 1 &rarr; Account 2
* **Thread B**: Transfer from Account 2 &rarr; Account 1

If Thread A acquires Lock(1) and attempts to acquire Lock(2), while Thread B acquires Lock(2) and attempts to acquire Lock(1), the database enters a **deadly circular wait (Deadlock)**, aborting one or both transactions.

### The Solution: Deterministic Ascending Lock Hierarchy
ApexBank eliminates deadlocks at the mathematical model level by enforcing strict **deterministic lock acquisition**:
$$\text{firstLock} = \min(\text{sourceId}, \text{destId})$$
$$\text{secondLock} = \max(\text{sourceId}, \text{destId})$$

Both threads are forced to acquire locks in the exact same physical order (`lowerId` first, `higherId` second). A circular wait condition is mathematically impossible.

```mermaid
sequenceDiagram
    autonumber
    participant ClientA as Thread A (Transfer 1 -> 2)
    participant ClientB as Thread B (Transfer 2 -> 1)
    participant Engine as Transaction Engine
    participant DB as PostgreSQL (SELECT ... FOR UPDATE)

    Note over ClientA,ClientB: Concurrent Cross-Transfer Requests Fired
    ClientA->>Engine: transfer(ACC1, ACC2, ₹100.00)
    ClientB->>Engine: transfer(ACC2, ACC1, ₹50.00)

    rect rgb(20, 30, 50)
    Note over Engine: Deterministic Ordering: min(ID_1, ID_2) = ID_1, max = ID_2
    Engine->>DB: Thread A: SELECT * FROM accounts WHERE id = 1 FOR UPDATE
    DB-->>Engine: Thread A acquires Row Lock(1)
    
    Engine->>DB: Thread B: SELECT * FROM accounts WHERE id = 1 FOR UPDATE
    DB-->>Engine: Thread B BLOCKED (waits on Row Lock 1 held by Thread A)
    end

    rect rgb(30, 40, 60)
    Engine->>DB: Thread A: SELECT * FROM accounts WHERE id = 2 FOR UPDATE
    DB-->>Engine: Thread A acquires Row Lock(2)
    Note over Engine: Thread A updates balances, writes ledger, audits, commits
    Engine->>DB: Thread A: COMMIT (Releases Locks 1 & 2)
    end

    rect rgb(20, 50, 40)
    DB-->>Engine: Thread B WAKES UP, acquires Row Lock(1)
    Engine->>DB: Thread B: SELECT * FROM accounts WHERE id = 2 FOR UPDATE
    DB-->>Engine: Thread B acquires Row Lock(2)
    Note over Engine: Thread B updates balances, writes ledger, audits, commits
    Engine->>DB: Thread B: COMMIT (Releases Locks 1 & 2)
    end

    Note over ClientA,ClientB: Both Transfers Complete with ZERO Deadlocks!
```

---

## 4. Transactional Outbox Pattern & Real-Time STOMP WebSockets

To guarantee that database updates and client notifications never drift (solving the dual-write problem), ApexBank implements the **Transactional Outbox Pattern**:

```mermaid
sequenceDiagram
    autonumber
    participant API as Transaction Service
    participant DB as PostgreSQL Database
    participant Poller as Outbox Poller Worker
    participant STOMP as STOMP Message Broker
    participant Web as Connected React Client

    API->>DB: BEGIN Transaction
    API->>DB: Update Account Balances
    API->>DB: Insert Transaction Ledger Row
    API->>DB: Insert Notification Outbox Record (Status: PENDING)
    API->>DB: COMMIT Transaction (Atomically Saved)

    Note over Poller,DB: Poller queries PENDING outbox records periodically
    Poller->>DB: SELECT * FROM notification_outbox WHERE status = 'PENDING' FOR UPDATE SKIP LOCKED
    DB-->>Poller: Outbox Records Batch
    Poller->>STOMP: simpMessagingTemplate.convertAndSend("/topic/transactions", payload)
    STOMP-->>Web: Real-Time Event Delivered via WebSocket
    Poller->>DB: UPDATE notification_outbox SET status = 'SENT'
```

---

## 5. Role-Based Underwriting State Machine

Loan applications undergo structured underwriting enforcing distinct separation of duties:
* **Loan Officers** can evaluate creditworthiness, check DTI ratio, and recommend approval for standard loans.
* **Loans exceeding ₹500,000.00** require mandatory **Administrator final sign-off**.
* Self-approval is strictly forbidden.

```mermaid
stateDiagram-v2
    [*] --> PENDING: Customer Applies
    PENDING --> UNDER_REVIEW: Loan Officer Starts Assessment
    UNDER_REVIEW --> ADDITIONAL_INFORMATION_REQUIRED: Documentation Clarification Needed
    ADDITIONAL_INFORMATION_REQUIRED --> UNDER_REVIEW: Customer Provides Documents
    UNDER_REVIEW --> APPROVED: Standard Loan Approved (<= ₹500,000)
    UNDER_REVIEW --> PENDING_ADMIN_APPROVAL: High-Value Loan (> ₹500,000)
    PENDING_ADMIN_APPROVAL --> APPROVED: Admin Approves
    PENDING_ADMIN_APPROVAL --> REJECTED: Admin Rejects
    UNDER_REVIEW --> REJECTED: Ineligible / DTI > 50%
    APPROVED --> DISBURSED: Core Engine Executes Funds Transfer
    DISBURSED --> PAID: All Installments Completed
    DISBURSED --> [*]
    REJECTED --> [*]
```

---

## 6. High-Concurrency Performance Benchmark Results

The benchmark harness was executed against live PostgreSQL 18.3 under high multi-threaded pressure, testing concurrency scaling, deterministic lock performance, and strict ACID invariants.

### Concurrency Scaling Summary

| Concurrency Level | Target Transactions | Duration (s) | Throughput (TPS) | Min Latency | p50 (Median) | p95 Latency | p99 Latency | Max Latency | Deadlocks | Success Rate |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1 Thread** | 50 | 3.212 s | **15.57 TPS** | 30 ms | 53 ms | 112 ms | 321 ms | 321 ms | **0** | **100.00%** |
| **5 Threads** | 100 | 1.784 s | **56.05 TPS** | 28 ms | 81 ms | 188 ms | 302 ms | 302 ms | **0** | **100.00%** |
| **10 Threads** | 200 | 3.881 s | **51.53 TPS** | 19 ms | 131 ms | 538 ms | 942 ms | 1149 ms | **0** | **100.00%** |
| **20 Threads** | 300 | 5.039 s | **59.54 TPS** | 17 ms | 215 ms | 915 ms | 1319 ms | 1622 ms | **0** | **100.00%** |

### ACID Invariants & Correctness Audit

1. **Deadlock Invariant Test**:
   * Executed 100 simultaneous bidirectional cross-transfers between shared account pairs.
   * **Result**: **0 Deadlocks**. All 100 transactions committed successfully.
2. **Conservation of Money Invariant**:
   * Executed 150 randomized concurrent cross-transfers across accounts.
   * Total system balance before test: **₹2,000,000.00**.
   * Total system balance after test: **₹2,000,000.00**.
   * **Result**: **Zero drift ($0.00 divergence)**. No negative balances permitted.
3. **Concurrent Idempotency Replay Test**:
   * 10 concurrent threads fired identical transaction ID simultaneously.
   * **Result**: Exactly 1 execution committed to ledger; 9 threads received cached idempotent response. Balance modified exactly once.
