# Architecture Design Record: Concurrency Control, Locking Strategy & Idempotency

## 1. Context & Problem Statement
In core banking systems, transactions arrive concurrently from various channels (ATMs, web portals, mobile banking, batch feeds). The engine must guarantee ACID properties under high load:
- **No Lost Updates:** Concurrent debits or credits must never overwrite each other.
- **No Negative Balances:** Simultaneous withdrawals or transfers must never overdraft an account beyond available funds.
- **No Deadlocks:** Bi-directional transfers between accounts (e.g. A &rarr; B and B &rarr; A) must never enter a circular lock-wait deadlock.
- **Strict Idempotency:** Duplicate network submissions with identical `transactionId` must update balances exactly once.

---

## 2. Locking Strategy Analysis

### Option 1: Optimistic Locking (`@Version`)
- **Mechanism:** Read row version at beginning; check version hasn't changed at commit (`UPDATE ... WHERE id = ? AND version = ?`). Retry on conflict.
- **Pros:** Zero database lock wait overhead during reads; high throughput when contention is near zero.
- **Cons Under Banking Workload:** Highly active bank accounts (e.g., payroll accounts, merchant accounts) suffer severe retry storms. Under high contention, optimistic retries waste CPU and connection pool resources, leading to cascading transaction rollbacks.

### Option 2: Atomic SQL Update (`UPDATE accounts SET balance = balance - :amt WHERE id = :id AND balance >= :amt`)
- **Mechanism:** Direct conditional SQL update.
- **Pros:** Fast and simple for single-account debit.
- **Cons Under Banking Workload:** Insufficient for multi-account atomic transfers with complex multi-rule fraud evaluation, per-transaction limit verification, and auditable status logging that must evaluate consistent account state before applying mutations.

### Option 3: Pessimistic Row-Level Write Locking (`SELECT ... FOR UPDATE`) — SELECTED
- **Mechanism:** Lock the account row explicitly in PostgreSQL using `accountRepository.findByAccountNumberWithPessimisticLock(...)`.
- **Justification:**
  1. **Strict Serializability per Account:** Acquires an exclusive row-level lock immediately before checking balance, limits, and status.
  2. **Predictable Latency:** Concurrent operations queue cleanly at the database row level rather than failing and consuming compute in application retry loops.
  3. **Zero Phantom Reads:** Coupled with PostgreSQL's default `READ COMMITTED` isolation, subsequent transactions read the guaranteed post-commit balance as soon as the prior lock releases.

---

## 3. Deadlock Prevention: Deterministic Account Locking
In account-to-account transfers, locking two accounts introduces a classic Dining Philosophers deadlock hazard if locks are acquired arbitrarily:
- **Scenario:**
  - Thread 1: Transfers from Account 1 &rarr; Account 2 (locks Acc 1, waits for Acc 2)
  - Thread 2: Transfers from Account 2 &rarr; Account 1 (locks Acc 2, waits for Acc 1)
  - **Outcome:** PostgreSQL aborts one transaction with `ERROR: deadlock detected`.

### The Solution: Ascending ID Deterministic Ordering
Our engine sorts the participating account primary keys before acquiring any locks:
```java
Long lowerId = Math.min(sourceId, destId);
Long higherId = Math.max(sourceId, destId);

// 1. Lock lower ID first
Account firstLocked = accountRepository.findByIdWithPessimisticLock(lowerId)...;

// 2. Lock higher ID second
Account secondLocked = accountRepository.findByIdWithPessimisticLock(higherId)...;
```
**Mathematical Proof:**
Because every thread locks accounts strictly in order of `ID_1 < ID_2`, a cycle in the resource allocation graph (circular wait) is impossible. Deadlocks are 100% prevented by design.

---

## 4. Multi-Layer Idempotency Defense
1. **Application-Level In-Flight Lock Cache (`ConcurrentHashMap` + `ReentrantLock`):**
   - Serializes concurrent identical requests in-memory so only one thread executes the database supplier.
2. **Database Lookup Before Execution:**
   - Checks if `transaction_id` is already stored in `transactions`. If found, immediately returns the original transaction receipt without touching balances.
3. **Database Uniqueness Invariant (`UNIQUE (transaction_id)`):**
   - Absolute fallback: In case of multi-node cluster deployment, PostgreSQL enforces uniqueness at the storage engine level, rejecting duplicate inserts and triggering graceful idempotent receipt recovery.
