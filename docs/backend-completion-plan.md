# Backend Completion and Hardening Plan

This document outlines the systematic completion, hardening, testing, and verification of the `scalable-ecommerce-platform` backend.

## Progress Checklist

- [x] **Phase 1: Authentication and Authorization Hardening**
  - [x] Prevent public registration from assigning privileged roles (sellers/admins)
  - [x] Sanitize API responses so password hashes and secrets are never returned
  - [x] Secure JWT cookies (`httpOnly`, `sameSite`, `secure`) and add Bearer token fallback in `authMiddleware`
  - [x] Fix `authorize` middleware array-argument bug across all routes
  - [x] Protect auth rate-limiting against Redis failures
  - [x] Add strict input validation against NoSQL injection

- [x] **Phase 2: Products, Categories, Sellers, and Redis Caching**
  - [x] Allow admin to update/delete any product while restricting sellers to their own products
  - [x] Automatically create and link inventory variants when products are created
  - [x] Validate category existence during product creation/updates
  - [x] Prevent deletion of categories that are in active use by products
  - [x] Audit and harden Redis caching with graceful degradation when Redis is offline

- [x] **Phase 3: Cart, Orders, and Checkout Concurrency**
  - [x] Strictly recalculate prices from active database records during checkout
  - [x] Validate shipping address fields and cart availability
  - [x] Implement missing order management endpoints (list orders, order details, cancel order, update status)
  - [x] Release inventory reservations when orders are cancelled or expired

- [ ] **Phase 4: Inventory, Reservations, and Concurrency**
  - [ ] Establish `Inventory` as the authoritative inventory source across all operations
  - [ ] Enforce seller ownership on inventory modifications
  - [ ] Atomic conditional updates to prevent concurrent overselling
  - [ ] Idempotent reservation creation, confirmation, release, and expiry

- [ ] **Phase 5: Razorpay Payment Reliability & Reconciliation**
  - [ ] Webhook signature verification with raw body and timing-safe comparison
  - [ ] Idempotent webhook handling with event ID tracking
  - [ ] Durable reconciliation queue for duplicate charges and expired reservations
  - [ ] Safe mockable payment service for testing without live credentials

- [ ] **Phase 6: Infrastructure, Observability, and Graceful Shutdown**
  - [ ] Centralized Express error handler and 404 handler
  - [ ] Health (`/health`) and Readiness (`/ready`) endpoints
  - [ ] Graceful shutdown handlers for HTTP server, MongoDB, Redis, and timers
  - [ ] Resilient Redis connection lifecycle and failure tolerance

- [ ] **Phase 7: Automated Unit and Integration Tests**
  - [ ] Auth & Authorization tests
  - [ ] Product & Category tests
  - [ ] Cart & Order tests
  - [ ] Inventory contention & reservation tests
  - [ ] Payment & Webhook verification tests
  - [ ] Health & readiness endpoint tests

- [ ] **Phase 8: Docker, Documentation & Environment Readiness**
  - [ ] Reproducible `docker-compose.yml` for local MongoDB & Redis
  - [ ] Updated `.env.example`
  - [ ] Complete API & Setup documentation in `README.md`
