# Multi-Threaded Banking Transaction Processing System

A high-concurrency, fault-tolerant, auditable core banking transaction engine built with **Java 17+**, **Spring Boot 3**, **PostgreSQL**, and **React + TypeScript (Vite)**.

Designed for high-throughput banking operations (handling 50,000+ simulated transactions), preserving strict financial invariants under intense concurrent workloads.

---

## Architecture Highlights
- **Deterministic Row-Level Locking:** Eliminates deadlock risk and prevents negative balances during simultaneous account debits and transfers.
- **Strict Idempotency:** Dual-layer idempotency (application-level cache + PostgreSQL unique constraints) ensures identical transaction IDs produce zero duplicate financial impact.
- **Transactional Outbox:** Guaranteed event publication for real-time WebSocket notifications only after the database transaction commits.
- **Rule-Based Fraud Engine:** Extensible risk scoring detecting high velocity, large amounts, and repeated failed attempts.
- **Full Observability & Auditability:** Structured SLF4J/MDC logs paired with normalized database audit and failure records.

---

## Monorepo Layout
```
banking-transaction-system/
├── backend/                  # Spring Boot 3 Java Service
│   ├── src/main/java/        # Business logic, concurrency engine, controllers
│   ├── src/main/resources/   # Application configs and logging setups
│   └── src/test/java/        # Concurrency, unit, and integration tests
├── frontend/                 # React 18 + TypeScript + Vite Dashboard
│   ├── src/                  # Enterprise banking components & pages
│   ├── public/               # Static assets
│   └── package.json          # Dependencies & scripts
├── database/                 # Database definitions and SQL assets
│   ├── migrations/           # Flyway SQL schema migrations
│   ├── seed/                 # Development and test seed datasets
│   └── reports/              # Mandatory analytical & optimization SQL scripts
├── infrastructure/           # Containerization and operational assets
│   ├── docker/               # Dockerfiles and web server proxy configs
│   └── monitoring/           # Prometheus and Grafana monitoring assets
├── docs/                     # Architectural documentation
│   ├── architecture/         # System design & concurrency workflow diagrams
│   ├── er-diagram/           # Relational ER diagrams and schema specifications
│   └── design-decisions/     # Concurrency, locking & idempotency design records
├── .gitignore                # Comprehensive version control ignore rules
├── .env.example              # Template environment variables
├── docker-compose.yml        # Multi-container orchestration
└── README.md                 # Project documentation and roadmap
```

---

## Milestone Progress Roadmap

- [x] **Milestone 1:** Repository structure, monorepo scaffold, configuration templates, and project setup.
- [ ] **Milestone 2:** Spring Boot backend and PostgreSQL connection.
- [ ] **Milestone 3:** Database schema, migrations, entities, and repositories.
- [ ] **Milestone 4:** Customer and account management APIs.
- [ ] **Milestone 5:** Deposit, withdrawal, and transfer services.
- [ ] **Milestone 6:** Database locking, concurrency, and idempotency.
- [ ] **Milestone 7:** Audit logging and exception handling.
- [ ] **Milestone 8:** JWT authentication and RBAC.
- [ ] **Milestone 9:** Fraud detection.
- [ ] **Milestone 10:** Account freeze and risk controls.
- [ ] **Milestone 11:** Transactional outbox and real-time notifications.
- [ ] **Milestone 12:** Analytics APIs and SQL reports.
- [ ] **Milestone 13:** React frontend and dashboard.
- [ ] **Milestone 14:** Backend/frontend integration and authorization testing.
- [ ] **Milestone 15:** Concurrency tests and 50,000-transaction benchmarks.
- [ ] **Milestone 16:** Docker, documentation, architecture diagrams, and final review.

---

## Quickstart & Local Verification

### Prerequisites
- JDK 17 or higher
- Apache Maven 3.9+
- Node.js 18+ & npm 9+
- PostgreSQL 15+ (or Docker)

### Verification Commands
```bash
# 1. Verify Backend Build & Smoke Tests
cd backend
mvn clean test-compile
mvn test

# 2. Verify Frontend Dependencies & Build
cd ../frontend
npm install
npm run build
```
