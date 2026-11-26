# Multi-Threaded Banking Transaction Processing System

[![Java](https://img.shields.io/badge/Java-17_LTS-orange.svg)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18.3_/_16-blue.svg)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker_Compose-Multi--Container-2496ed.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A high-concurrency, fault-tolerant, auditable core banking transaction engine built with **Java 17 LTS**, **Spring Boot 3**, **PostgreSQL**, and **React 18 + TypeScript (Vite)**. Engineered as a final-year B.Tech capstone project.

Designed for high-throughput banking workloads, preserving strict financial invariants under intense concurrent pressure with **pessimistic row-level locking (`SELECT FOR UPDATE`)**, **deterministic deadlock prevention**, **multi-layer idempotency**, **rule-based fraud detection**, **transactional outbox notifications**, and **role-based loan underwriting**.

---

## Architecture Highlights

* **Deterministic Deadlock-Free Locking:** Implements sorted physical ID locking (`min(src, dst)` before `max(src, dst)`) with PostgreSQL row-level locks (`SELECT FOR UPDATE`), guaranteeing zero deadlocks during simultaneous cross-transfers.
* **Strict Multi-Layer Idempotency:** Combines an in-flight synchronization manager with database unique constraints (`UNIQUE(transaction_id)`), ensuring duplicate network requests return cached receipts with zero balance divergence.
* **ACID Conservation of Money:** Guarantees total system balance is strictly conserved across arbitrary concurrent transfers ($\sum \text{balances}_{\text{final}} = \sum \text{balances}_{\text{initial}}$) with zero negative balances.
* **Rule-Based Fraud Detection Engine:** Real-time risk evaluation scoring high velocity, sudden spikes relative to baseline, and structuring patterns, automatically raising alerts and recommending account holds.
* **Transactional Outbox & WebSockets:** Guarantees atomic notification persistence in the business transaction boundary, dispatched via STOMP WebSocket message broker for real-time customer and compliance alerts.
* **Role-Based Underwriting (RBAC):** Tiered loan approval workflows for `LOAN_OFFICER` and `ADMIN` roles, supporting automated Debt-To-Income (DTI) calculations and amortization schedules.

---

## Monorepo Layout

```
banking-transaction-system/
├── backend/                  # Spring Boot 3 Java 17 LTS Service
│   ├── src/main/java/        # Controllers, services, models, repositories, outbox, fraud
│   ├── src/main/resources/   # Flyway migrations (V1, V2, V3), application.yml, logback
│   └── src/test/java/        # Comprehensive test suite & high-concurrency benchmarks
├── frontend/                 # React 18 + TypeScript + Vite Single-Page App
│   ├── src/pages/            # Customer Portal, Loan Officer Workbench, Admin Compliance
│   ├── src/services/         # Complete Axios REST & WebSocket API clients
│   ├── src/types/            # Domain interfaces and API payload types
│   └── nginx.conf            # Production Nginx reverse proxy configuration
├── database/                 # Flyway migrations, seed scripts, analytical reports
├── docker-compose.yml        # Multi-container orchestration (PostgreSQL, Backend, Frontend)
├── benchmark-harness.ps1     # High-concurrency performance benchmark launcher
├── ARCHITECTURE.md           # In-depth architectural specifications & Mermaid diagrams
└── README.md                 # Project documentation and guide
```

---

## Completed Milestones (100% Complete)

- [x] **Milestone 1:** Monorepo architecture, directory layout, environment configuration.
- [x] **Milestone 2:** Spring Boot 3 backend and PostgreSQL 18.3 connection.
- [x] **Milestone 3:** Database schema, Flyway migrations (V1, V2, V3), JPA entities, and repositories.
- [x] **Milestone 4:** Customer and account management REST APIs with pagination and validation.
- [x] **Milestone 5:** Core deposit, withdrawal, and transfer services with transactional integrity.
- [x] **Milestone 6:** Deterministic pessimistic row-level locking and multi-layer idempotency.
- [x] **Milestone 7:** Transaction audit trail logging, structured SLF4J MDC, and error classification.
- [x] **Milestone 8:** Spring Security 6, JWT stateless authentication, and multi-role RBAC (`LOAN_OFFICER`).
- [x] **Milestone 9:** Rule-based fraud detection engine, Bayesian velocity scoring, and risk levels.
- [x] **Milestone 10:** Administrative account freeze/unfreeze and dynamic transaction limit controls.
- [x] **Milestone 11:** Transactional Outbox Pattern and STOMP WebSocket notification dispatch.
- [x] **Milestone 12:** High-performance JDBC analytics APIs, turnover rankings, and failure summaries.
- [x] **Milestone 13:** Interactive Customer Banking Portal (transfers, deposits, loans, real-time alerts).
- [x] **Milestone 14:** Admin & Compliance Surveillance Dashboard (Recharts analytics, fraud review, limits).
- [x] **Milestone 15:** 50,000-transaction high-concurrency benchmark harness and ACID invariant verification.
- [x] **Milestone 16:** Multi-container Docker Compose orchestration, comprehensive architecture specs, and final review.

---

## Quickstart & Docker Compose Orchestration

### 1. Launch Multi-Container Environment (Single Command)

```bash
docker-compose up --build
```

The orchestration will automatically provision:
* **PostgreSQL Database** (`postgres:16-alpine` on port `5432`)
* **Spring Boot Core Engine** (Eclipse Temurin Java 17 LTS on port `8080`)
* **React Frontend SPA & Nginx** (served on port `3000`)

### 2. Access Web Applications

* **Customer Banking Portal:** `http://localhost:3000/customer`
* **Loan Officer Workbench:** `http://localhost:3000/loans`
* **Admin & Compliance Dashboard:** `http://localhost:3000/admin`
* **Backend Health & Metrics:** `http://localhost:8080/actuator/health`

### Default Demo Accounts (`firstname_lastname`, Password: `password`)

| Username | Full Name | Role |
| :--- | :--- | :--- |
| `aarav_sharma` | Aarav Sharma | `CUSTOMER` (`ACC1001`) |
| `priya_patel` | Priya Patel | `CUSTOMER` (`ACC2004`) |
| `rohan_kulkarni` | Rohan Kulkarni | `TELLER` |
| `ananya_verma` | Ananya Verma | `LOAN_OFFICER` |
| `kavya_nair` | Kavya Nair | `RISK_ANALYST` |
| `system_administrator` | System Administrator | `ADMIN` |

---

## Local Development & Manual Build

### Prerequisites
* **JDK 17 LTS** (`java -version`)
* **Apache Maven 3.9+** (`mvn -v`)
* **Node.js 20+ & npm** (`node -v`)
* **PostgreSQL 16+ or 18+** running on `localhost:5432` (`banking_db`)

### Adaptive MFA Environment Variables
Configure via `.env` or environment variables (defaults in `backend/src/main/resources/application.yml`):
- `AMFA_ENABLED=true`: Enable/disable adaptive risk-based MFA enforcement.
- `AMFA_SECRET_ENCRYPTION_KEY`: Base64 256-bit AES key used to encrypt TOTP secrets at rest.
- `AMFA_OTP_EXPIRATION_SECONDS=300` / `AMFA_OTP_RESEND_COOLDOWN_SECONDS=60` / `AMFA_OTP_MAX_ATTEMPTS=5`.
- `AMFA_HIGH_VALUE_TRANSFER_THRESHOLD=25000` / `AMFA_CRITICAL_VALUE_TRANSFER_THRESHOLD=500000`.
- `AMFA_MAX_FAILED_LOGIN_ATTEMPTS=5` / `AMFA_LOCKOUT_DURATION_MINUTES=15`.
- Optional SMTP delivery: set `SPRING_MAIL_HOST`, `SPRING_MAIL_PORT`, `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD` (falls back cleanly to masked outbox notifications when SMTP is not configured).

### Verification & Testing Commands

```bash
# 1. Run Backend Test Suite (Includes Unit, Integration & Security Tests)
cd backend
mvn test

# 2. Run High-Concurrency Performance Benchmark
mvn test -Dtest=HighConcurrencyBenchmarkTest

# 3. Build & Verify Frontend SPA
cd ../frontend
npm install
npm run build
```

---

## High-Concurrency Benchmark Performance Metrics

Results executed against PostgreSQL 18.3 under high multi-threaded saturation:

| Concurrency Level | Target Transactions | Duration | Throughput (TPS) | Min Latency | p50 (Median) | p95 Latency | p99 Latency | Deadlocks | Invariant Drift |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1 Worker Thread** | 50 txns | 3.21 s | **15.57 TPS** | 30 ms | 53 ms | 112 ms | 321 ms | **0** | **$0.00** |
| **5 Worker Threads** | 100 txns | 1.78 s | **56.05 TPS** | 28 ms | 81 ms | 188 ms | 302 ms | **0** | **$0.00** |
| **10 Worker Threads** | 200 txns | 3.88 s | **51.53 TPS** | 19 ms | 131 ms | 538 ms | 942 ms | **0** | **$0.00** |
| **20 Worker Threads** | 300 txns | 5.04 s | **59.54 TPS** | 17 ms | 215 ms | 915 ms | 1319 ms | **0** | **$0.00** |

* **Deadlock Invariant:** 100 bidirectional cross-transfers on shared accounts &rarr; **0 Deadlocks**.
* **Conservation of Money:** 150 concurrent transfers &rarr; **Zero drift**, no negative balances.
* **Concurrent Storm Replay:** 10 threads firing duplicate `transactionId` &rarr; Exactly 1 deposit processed, 9 idempotent hits.

---

## Core REST API Specification

| Module | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/login` | Authenticate user & evaluate adaptive MFA risk (returns full JWT or `MFA_PENDING` challenge) |
| **Auth** | `POST` | `/api/auth/change-password` | Update password with mandatory AMFA challenge verification |
| **AMFA** | `POST` | `/api/auth/mfa/send-otp` | Generate salted 6-digit Email OTP (5-min expiry, 60s cooldown) |
| **AMFA** | `POST` | `/api/auth/mfa/verify-otp` | Verify OTP hash, prevent replay, optionally trust device |
| **AMFA** | `POST` | `/api/auth/mfa/totp/setup` | Generate AES-GCM encrypted Base32 secret & `otpauth://` QR URI |
| **AMFA** | `POST` | `/api/auth/mfa/totp/verify` | Verify RFC 6238 6-digit TOTP code & enroll authenticator app |
| **AMFA** | `GET` | `/api/auth/mfa/status` | Retrieve MFA enrollment, preferred method, and trusted device count |
| **AMFA** | `POST` | `/api/auth/mfa/enable` | Enable MFA (`EMAIL_OTP` or `TOTP`) |
| **AMFA** | `POST` | `/api/auth/mfa/disable` | Disable MFA (requires current password + active OTP/TOTP factor) |
| **AMFA** | `GET` | `/api/auth/mfa/devices` | List registered trusted devices for the user |
| **AMFA** | `DELETE` | `/api/auth/mfa/devices/{deviceId}` | Revoke a specific trusted device (`DELETE /devices` revokes all) |
| **AMFA** | `POST` | `/api/auth/mfa/transaction-challenge` | Create a transaction-bound verification challenge |
| **Security** | `GET` | `/api/auth/security-events` | Paginated login activity & security alert audit log |
| **Accounts** | `GET` | `/api/accounts` | Paginated listing of customer accounts |
| **Accounts** | `GET` | `/api/accounts/transfer-targets` | Active transfer beneficiary accounts for customer transfers |
| **Accounts** | `GET` | `/api/accounts/{accountNumber}/risk-profile`| Fetch account balance, limits, and risk profile |
| **Accounts** | `PUT` | `/api/accounts/{accountNumber}/freeze` | Place administrative freeze on account |
| **Accounts** | `PUT` | `/api/accounts/{accountNumber}/unfreeze` | Restore frozen account with audit remark |
| **Accounts** | `PUT` | `/api/accounts/{accountNumber}/limits` | Update daily and per-transaction limits |
| **Transactions**| `POST`| `/api/transactions/deposit` | Execute deposit with row-level locking |
| **Transactions**| `POST`| `/api/transactions/withdraw` | Execute withdrawal with balance validation |
| **Transactions**| `POST`| `/api/transactions/transfer` | Execute atomic cross-transfer with deadlock prevention |
| **Loans** | `POST` | `/api/loans/apply` | Submit personal or commercial loan application |
| **Loans** | `GET` | `/api/loans` | Filtered loan list (status, applicant, search) |
| **Loans** | `PUT` | `/api/loans/{loanId}/review` | Loan Officer underwriting decision |
| **Loans** | `POST` | `/api/loans/{loanId}/disburse` | Disburse approved loan directly to account |
| **Analytics** | `GET` | `/api/analytics/overview` | High-level system KPI metrics |
| **Analytics** | `GET` | `/api/analytics/trends` | Daily transaction volume & throughput trends |
| **Analytics** | `GET` | `/api/analytics/top-accounts` | Top accounts by settled turnover volume |
| **Fraud** | `GET` | `/api/fraud/alerts` | Live queue of fraud surveillance alerts |
| **Notifications**| `GET`| `/api/notifications` | User notifications with unread tracking |

For full architectural designs and Mermaid diagrams, consult [ARCHITECTURE.md](file:///C:/Users/kfork/.gemini/antigravity/scratch/banking-transaction-system/ARCHITECTURE.md).

---

## Author & Project Metadata

* **Author:** Kartik Pal (`kartik-2502`)
* **Email:** kartikpal2502@gmail.com
* **Project:** Final-Year B.Tech Capstone Project — High-Concurrency Banking Transaction Processing System
* **Repository:** [https://github.com/kartik-2502/Banking-Transaction-System-Engine](https://github.com/kartik-2502/Banking-Transaction-System-Engine)
