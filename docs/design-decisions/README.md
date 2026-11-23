# Architecture & Engineering Design Decisions
Comprehensive justification of:
1. Concurrency control: Pessimistic locking (SELECT ... FOR UPDATE) vs Optimistic locking vs Atomic SQL updates.
2. Deadlock prevention: Deterministic account ID sorting (Lock lower ID -> Lock higher ID).
3. Idempotency guarantees: Database unique constraints + application-level idempotency key checks.
4. Transactional Outbox pattern for WebSocket notification delivery.
5. Index selection and query plan analysis.
