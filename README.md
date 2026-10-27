# Scalable E-Commerce Backend

A high-performance, fault-tolerant e-commerce backend built with Node.js, Express, MongoDB, Redis, and Razorpay.

## Architecture & Technology Stack

- **Runtime & Framework**: Node.js (v20+ / v22+) & Express 5
- **Database**: MongoDB with Mongoose (with full multi-document transaction and replica-set support)
- **Caching & Rate Limiting**: Redis with graceful degradation on network/store failure
- **Payment Gateway**: Razorpay (HMAC SHA-256 raw-body webhook verification, idempotent handling, reconciliation queue)
- **Authentication**: JWT authentication with HTTP-only, secure, SameSite cookies and optional Bearer token fallback
- **Roles & Permissions**: Role-Based Access Control (`buyer`, `seller`, `admin`)
- **Containerization**: Docker & Docker Compose (single-node replica set for local MongoDB transactions)

---

## Key Features & Hardening

1. **Role-Based Authorization & Public Escalation Defense**:
   - Public registration strictly assigns the `buyer` role. Attempts to pass `seller` or `admin` are rejected with HTTP 403.
   - User serialization strips password hashes and sensitive secrets from all API responses.
2. **Product & Inventory Synchronization**:
   - `Inventory` (with variants, totalStock, reservedStock, and availableStock) is the authoritative inventory model.
   - Creating a product automatically initializes its corresponding inventory record.
   - Product stock is synchronized across updates, reservations, and confirmations.
   - Only admins or the seller who owns a product can update or delete it.
   - Products with active reservations or pending orders cannot be deleted.
3. **Checkout Concurrency & Price Integrity**:
   - Prices are strictly recalculated from active database records during checkout. Client-submitted prices are ignored.
   - Atomic conditional updates (`$elemMatch` on `availableStock >= quantity`) prevent overselling under high concurrency.
   - Reservations expire after 15 minutes if unpaid; a background scheduler safely releases reserved inventory back to available stock.
   - Cancelling an unpaid order immediately releases reserved stock.
4. **Payment Gateway Reliability**:
   - Raw request body HMAC-SHA256 signature verification with timing-safe comparisons prevents timing attacks.
   - Duplicate webhook deliveries are detected and safely acknowledged via unique event IDs.
   - Duplicate charges or inventory discrepancies are durably logged to the `PaymentIssue` reconciliation queue for administrative review.
5. **Observability & Graceful Shutdown**:
   - Liveness probe at `GET /health` and readiness probe at `GET /ready` (verifies MongoDB connection).
   - Graceful shutdown handles `SIGTERM` and `SIGINT`, cleanly closing the HTTP server, database connections, Redis clients, and background intervals.

---

## Local Development Setup

### Option 1: Docker Compose (Recommended)

To spin up MongoDB (configured with single-node replica set `rs0` for multi-document transactions), Redis, and the backend service:

```bash
docker compose up -d
```

Check service status:
```bash
docker compose ps
curl http://localhost:3000/health
curl http://localhost:3000/ready
```

### Option 2: Running Locally with Node.js

1. **Install dependencies**:
   ```bash
   cd Backend
   npm install
   ```

2. **Configure Environment Variables**:
   Copy the example environment configuration:
   ```bash
   cp .env.example .env
   ```
   Fill in your MongoDB URI (Atlas or local replica set), Redis URL, JWT Secret, and Razorpay test credentials.

3. **Start the Server**:
   ```bash
   node server.js
   ```

4. **Run Automated Tests**:
   ```bash
   npm test
   ```

---

## Environment Variables Reference

| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | HTTP port the server listens on | `3000` |
| `NODE_ENV` | Environment mode (`development`, `production`, `test`) | `development` |
| `MONGODB_URI` | MongoDB connection URI (replica set recommended) | `mongodb://localhost:27017/ecommerce?replicaSet=rs0` |
| `REDIS_URL` | Redis server connection URL | `redis://localhost:6379` |
| `JWT_SECRET` | Secret key for signing JSON Web Tokens | `your_secret_key_at_least_32_characters` |
| `RAZORPAY_KEY_ID` | Razorpay test key ID | `rzp_test_xxxx` |
| `RAZORPAY_KEY_SECRET` | Razorpay test key secret | `your_razorpay_secret` |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook verification secret | `your_webhook_secret` |

---

## API Documentation

### Health & Observability
- `GET /health`: Liveness probe. Returns `{ status: 'ok', uptime, timestamp }`.
- `GET /ready`: Readiness probe. Returns `{ status: 'ready', database: 'connected', redis: 'connected' }` or 503 if unavailable.

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Register a new user (`username`, `email`, `password`). Only `buyer` role can be registered publicly.
- `POST /api/auth/login`: Authenticate with `username` or `email` + `password`. Sets HTTP-only cookie and returns sanitized user object.
- `POST /api/auth/logout`: Clears the authentication cookie.

### Categories (`/api/categories`)
- `POST /api/categories`: Create a category (`name`). *Role: admin*
- `GET /api/categories`: Get all categories. *Role: buyer, seller, admin*
- `GET /api/categories/:id`: Get category by ID. *Role: buyer, seller, admin*
- `PUT /api/categories/:id`: Update category name. *Role: admin*
- `DELETE /api/categories/:id`: Delete category (blocked if products are currently assigned to it). *Role: admin*

### Products (`/api/products`)
- `POST /api/products`: Create a product (`name`, `description`, `price`, `stock`, `category`, `image`). Automatically creates inventory record. *Role: seller, admin*
- `GET /api/products`: List products with pagination (`page`, `limit`), filtering (`category`, `minprice`, `maxprice`), sorting (`price_asc`, `price_desc`, `newest`), and Redis caching.
- `GET /api/products/:id`: Get product details by ID (cached in Redis).
- `PUT /api/products/:id`: Update product. *Role: owning seller, admin*
- `DELETE /api/products/:id`: Delete product (blocked if active orders/reservations exist). *Role: owning seller, admin*

### Cart (`/api/cart`)
- `POST /api/cart/items`: Add item to cart (`product`, `quantity`, `variant`). *Role: buyer*
- `GET /api/cart`: Get current user's cart. *Role: buyer*
- `PATCH /api/cart/items/:productId`: Update item quantity in cart. *Role: buyer*
- `DELETE /api/cart/items/:productId`: Remove item from cart. *Role: buyer*
- `DELETE /api/cart`: Clear cart. *Role: buyer*

### Orders & Checkout (`/api/order` & `/api/orders`)
- `POST /api/order/create`: Checkout from cart. Validates `shippingAddress`, recalculates prices from DB, reserves stock atomically, clears cart. *Role: buyer*
- `GET /api/order`: List authenticated user's orders with pagination. *Role: buyer, admin*
- `GET /api/order/:id`: Get order details. *Role: owning buyer, admin*
- `PATCH /api/order/:id/cancel`: Cancel unpaid order and immediately release reserved inventory back to available stock. *Role: owning buyer, admin*
- `PATCH /api/order/:id/status`: Update delivery status (`pending`, `shipped`, `delivered`, `cancelled`). *Role: admin*

### Inventory (`/api/inventory`)
- `POST /api/inventory`: Create inventory record with variants. *Role: owning seller, admin*
- `GET /api/inventory/:productId`: Fetch inventory details for product.
- `PATCH /api/inventory/:productId`: Update variant stock (syncs product stock). *Role: owning seller, admin*
- `PATCH /api/inventory/:productId/reserve`: Atomically reserve variant stock.
- `PATCH /api/inventory/:productId/release`: Release reserved stock back to available stock.
- `PATCH /api/inventory/:productId/confirm`: Permanently deduct reserved and total stock upon verified payment.

### Reservations (`/api/reservations`)
- `PATCH /api/reservations/:orderId/confirm`: Idempotently confirm reservations for paid order. *Role: admin*
- `PATCH /api/reservations/:orderId/release`: Idempotently release reservations for failed/cancelled order. *Role: admin*

### Payments & Reconciliation (`/api/payments`)
- `POST /api/payments/:orderId`: Create or retrieve active Razorpay payment attempt for order. *Role: buyer*
- `POST /api/payments/webhook`: Webhook endpoint for Razorpay events (`payment.captured`, `payment.failed`). Requires raw request body and valid signature. Idempotent and concurrency-safe.
- `GET /api/payments/reconciliation`: List pending payment issues requiring manual review. *Role: admin*
- `PATCH /api/payments/reconciliation/:issueId/resolve`: Mark a reconciliation issue resolved with audit note. *Role: admin*

---

## Test Suite Execution

All unit, integration, and concurrency tests are built using Node's native test runner (`node:test`) and `supertest`:

```bash
cd Backend
npm test
```

### Test Coverage Summary
- **Auth**: Registration privilege blocking, password hashing sanitization, token extraction, role validation.
- **Products & Categories**: CRUD, seller ownership isolation, category integrity, cache invalidation.
- **Cart & Orders**: Cart updates, price recalculation from database, order cancellation, reservation release.
- **Concurrency & Inventory**: Simultaneous checkout race conditions, overselling prevention, reservation idempotency.
- **Payments & Webhooks**: HMAC signature verification, duplicate webhook events, payment failure retries, reconciliation queue.
- **Observability**: Health and readiness probes, 404 handler, error handling.