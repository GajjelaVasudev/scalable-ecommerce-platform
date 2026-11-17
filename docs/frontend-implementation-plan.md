# OMIZON Frontend Implementation Plan & Architecture Specification

## 1. Executive Summary

This document specifies the architecture, screen inventory, component design, routing hierarchy, and backend API integration for transforming the 34-screen Google Stitch UI prototype collection into a high-performance, production-grade React/TypeScript frontend for **OMIZON**.

OMIZON is a high-tier multi-category marketplace (Consumer Electronics, Artisan Home Living, Grocery & Essentials, Beauty & Personal Care, Fashion & Apparel). The frontend embodies **Modern High-End Utility** with a restrained, machined editorial aesthetic, calibrated against the official OMIZON brand palette and typography.

---

## 2. Design System & Brand Identity

### 2.1 Brand Tokens & Color Palette
- **Brand Anchor / Midnight Violet**: `#190B46` (Global topbars, dark containers, contrast accents, footer spine)
- **Primary Interactive / Electric Violet**: `#762FF2` (Primary CTAs, active filters, stepper focus, highlights)
- **Secondary / Hover / Royal Purple**: `#4C2ACB` (Hover states, active sorting, secondary link highlights)
- **Base Canvas / Porcelain**: `#F7F7FB` (Light mode background providing crisp separation)
- **Elevated Surface / Pure White**: `#FFFFFF` (Cards, modals, drawer surfaces, table rows)
- **Dividers & Structural Borders / Lavender Mist**: `#E8E6F0` (1px machined hairline borders)
- **Primary Typography / Ink**: `#211D31` (Headings, primary values)
- **Secondary Typography / Ink Muted**: `#655E7A` (Descriptions, subtitle metadata)
- **Tertiary / Ink Subtle**: `#928B9F` (Timestamps, SKU codes, breadcrumbs)

### 2.2 Dark Mode Palette
- **Obsidian Canvas**: `#100A25`
- **Container Tier 1**: `#1D1537`
- **Container Tier 2 / Flyouts**: `#211735`
- **Structural Borders**: `#382B54`
- **Primary Text**: `#F7F5FF`
- **Secondary Text**: `#C3BCD7`

### 2.3 Semantic Accents
- **Success / Affirmation**: `#00875A` (Light) / `#22C55E` (Dark)
- **Warning / Low Stock Urgency**: `#E27300` (Light) / `#F59E0B` (Dark)
- **Critical / Form Error / Out of Stock**: `#D92D20` (Light) / `#EF4444` (Dark)

### 2.4 Typography & Formatting
- **Font Family**: `Plus Jakarta Sans` applied exclusively across all headings, body text, prices, badges, tables, dashboards, and navigation.
- **Tabular Numerals**: `tabular-nums lining-nums` enforced on all prices, SKU quantities, and financial matrices.
- **Currency**: Indian Rupee (`₹`) formatted with standard Indian comma grouping (e.g. `₹24,999`, `₹48,92,450`).

---

## 3. Stitch Screen Inventory & Mapping

| # | Stitch Screen Folder | Application Route | Primary User Role | Functional Scope |
|---|----------------------|-------------------|-------------------|------------------|
| 1 | `omizon_home_marketplace` | `/` | Public / Buyer | Editorial Hero, Quick Metrics, Category Strip, Flash Deals, Curated Mosaic, Value Pillars, Brand Footer |
| 2 | `omizon_shop_all_products` | `/products` | Public / Buyer | Multi-category faceted search, price sliders, brand/rating filters, layout view switch, active filter pills, pagination |
| 3 | `omizon_product_details_pdp` | `/products/:id` | Public / Buyer | Multi-angle studio gallery thumbnails, 360 preview badge, stock status, quantity stepper, variant selector, Add to Cart, Buy Now, Specs & Reviews |
| 4 | `omizon_shopping_cart_cart_drawer` | `/cart` + Slide-over Drawer | Buyer | Active cart items, batch select/delete, item quantity increment/decrement, subtotal calculation, pincode delivery estimator, free shipping progress |
| 5 | `omizon_multi_step_checkout_payment` | `/checkout` | Buyer | 5-step stepper (Cart -> Address -> Delivery -> Payment -> Review), India-first shipping address form, Razorpay/UPI/Card/COD selector, order summary |
| 6 | `omizon_customer_account_hub_dashboard` | `/account` | Buyer | Profile summary, order quick-glance, saved addresses, payment methods, security & notification settings |
| 7 | `omizon_order_history_order_details` | `/orders`, `/orders/:id` | Buyer / Admin | Live delivery progress timeline (Placed, Confirmed, Shipped, Out for Delivery, Delivered), item list, tracking ID, cancel order CTA |
| 8 | `omizon_seller_dashboard` | `/seller/dashboard` | Seller | Gross revenue KPI, SLA countdown alert, urgent low-stock items, recent orders table, performance sparklines |
| 9 | `omizon_seller_add_edit_product` | `/seller/products/new`, `/seller/products/:id/edit` | Seller / Admin | Product metadata, category selector, price & initial stock, variant creation, image preview, active status |
| 10 | `omizon_seller_product_details_performance` | `/seller/products/:id` | Seller | SKU analytics, unit sales, inventory health, return rates, pricing history |
| 11 | `omizon_seller_orders_fulfilment_management` | `/seller/orders` | Seller | Orders pipeline, dispatch deadlines, status filtering, batch shipping label actions |
| 12 | `omizon_inventory_management_warehouse_stock_control` | `/seller/inventory` | Seller / Admin | Variant-level stock management, available vs reserved stock, low-stock threshold alerts, quick adjustment |
| 13 | `omizon_seller_analytics_business_intelligence` | `/seller/analytics` | Seller | Revenue growth charts, conversion funnel, category performance, regional sales breakdown |
| 14 | `omizon_seller_payouts_settlements_transactions` | `/seller/payouts` | Seller | Available balance, scheduled payouts, commission breakdown, transaction ledger |
| 15 | `omizon_seller_store_settings_configurations` | `/seller/settings` | Seller | Store profile, branding, dispatch address, GSTIN and tax configurations |
| 16 | `omizon_seller_account_management` | `/seller/account` | Seller | Primary contact, bank account details, business verification documents |
| 17 | `omizon_seller_applications_verification` | `/seller/verification` | Seller | Merchant onboarding verification checklist, document status, compliance sign-off |
| 18 | `omizon_order_fulfilment_dispatch_operations` | `/seller/fulfilment` | Seller | Manifest dispatch, courier assignment (FastX, BlueDart, Delhivery), barcode scanning flow |
| 19 | `omizon_platform_admin_dashboard` | `/admin/dashboard` | Admin | Executive GMV, platform net revenue, total orders, SLA compliance rate, critical platform alerts |
| 20 | `omizon_admin_dashboard_1` | Consolidate into `/admin/dashboard` | Admin | Integrated into master admin view (secondary operational metrics & category trends) |
| 21 | `omizon_admin_dashboard_2` | Consolidate into `/admin/dashboard` | Admin | Integrated into master admin view (real-time platform throughput & fraud telemetry) |
| 22 | `omizon_product_catalog_management` | `/admin/products` | Admin | Global catalog inspection, status toggle, moderation flags, price override, deletion |
| 23 | `omizon_platform_wide_orders_fulfilment` | `/admin/orders` | Admin | Cross-platform order lookup, status management, seller fulfillment override |
| 24 | `omizon_payments_settlements_refund_operations` | `/admin/payments` | Admin | Razorpay transaction records, reconciliation queue for duplicate/failed webhooks, manual issue resolution |
| 25 | `omizon_promotions_marketplace_campaigns` | `/admin/promotions` | Admin | Sitewide discount rules, coupon code generation, campaign schedule |
| 26 | `omizon_reports_analytics_audit_logs` | `/admin/reports` | Admin | Audit trails, user action logs, financial reconciliation export |
| 27 | `omizon_risk_fraud_trust_operations` | `/admin/risk` | Admin | Anomaly detection, suspicious checkout velocity alerts, account suspension controls |
| 28 | `omizon_catalog_governance_product_moderation` | `/admin/moderation` | Admin | Product submission review queue, brand copyright flags, prohibited item scanning |
| 29 | `omizon_platform_settings_access_control` | `/admin/settings` | Admin | System configuration, database/Redis health probes, RBAC role assignments |
| 30 | `omizon_returns_disputes_chargebacks` | `/admin/disputes` | Admin | Disputed orders, return authorizations, evidence inspection, refund approval |
| 31 | `omizon_official_logo_dark_background` | Logo Asset | System | SVG continuous infinity ribbon logo for dark navigation bar |
| 32 | `omizon_official_logo_light_background` | Logo Asset | System | SVG continuous infinity ribbon logo for light headers and documents |

---

## 4. Frontend Technology Stack & Setup

- **Framework**: React 18 / 19 with Vite
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom theme extensions (`tailwind.config.js`) matching Stitch tokens and Plus Jakarta Sans
- **Routing**: `react-router-dom` v6 with role-aware layouts:
  - `MarketplaceLayout`: Top announcement bar, primary brand header with search & cart drawer trigger, category navigation bar, main content, rich footer.
  - `SellerLayout`: Merchant sidebar navigation, quick metrics header, store switcher, notification drawer.
  - `AdminLayout`: Operational sidebar navigation, system health badge, platform alert ticker, admin controls.
  - `AuthLayout`: Centered, distraction-free branding container for login/register.
- **State Management & Data Fetching**:
  - `AuthContext`: Manages current user (`id`, `username`, `email`, `role`), login, logout, and token persistence.
  - `CartContext`: Local optimistic cart synced with `/api/cart` endpoints, supports drawer state.
  - `TanStack Query` (or custom typed client): Cached server queries for catalog and orders.
- **Icons**: Lucide React + Material Symbols fallback where matching Stitch exact icon names.

---

## 5. Frontend/Backend API Mapping

| Frontend Feature | HTTP Method | Backend Route | Required Role | Request Body / Query Params |
|------------------|-------------|---------------|---------------|------------------------------|
| Register Buyer | `POST` | `/api/auth/register` | Public | `{ username, email, password }` |
| User Login | `POST` | `/api/auth/login` | Public | `{ username/email, password }` |
| User Logout | `POST` | `/api/auth/logout` | Authenticated | None |
| Fetch Products | `GET` | `/api/products` | Authenticated (`buyer`, `seller`, `admin`) | `?page, limit, category, minprice, maxprice, sort` |
| Product Details | `GET` | `/api/products/:id` | Authenticated | None |
| Create Product | `POST` | `/api/products` | `seller`, `admin` | `{ name, description, price, stock, category, image }` |
| Update Product | `PUT` | `/api/products/:id` | Owning `seller`, `admin` | `{ name, description, price, stock, category, image }` |
| Delete Product | `DELETE` | `/api/products/:id` | Owning `seller`, `admin` | None |
| List Categories | `GET` | `/api/categories` | Authenticated | None |
| Create Category | `POST` | `/api/categories` | `admin` | `{ name }` |
| Fetch Cart | `GET` | `/api/cart` | `buyer` | None |
| Add Cart Item | `POST` | `/api/cart/items` | `buyer` | `{ product, quantity, variant }` |
| Update Cart Item | `PATCH` | `/api/cart/items/:productId` | `buyer` | `{ quantity, variant }` |
| Remove Cart Item | `DELETE` | `/api/cart/items/:productId` | `buyer` | Query or Body `{ variant }` |
| Clear Cart | `DELETE` | `/api/cart` | `buyer` | None |
| Create Order / Checkout | `POST` | `/api/order/create` | `buyer` | `{ shippingAddress: { fullName, phone, addressLine, city, state, postalCode, country } }` |
| List Buyer Orders | `GET` | `/api/order` | `buyer` | `?page, limit` |
| List All Orders | `GET` | `/api/order?all=true` | `admin` | `?all=true, page, limit` |
| Order Details | `GET` | `/api/order/:id` | Owning `buyer`, `admin` | None |
| Cancel Order | `PATCH` | `/api/order/:id/cancel` | Owning `buyer`, `admin` | None |
| Update Order Status | `PATCH` | `/api/order/:id/status` | `admin` | `{ deliveryStatus }` |
| Get Inventory | `GET` | `/api/inventory/:productId` | Authenticated | None |
| Update Inventory | `PATCH` | `/api/inventory/:productId` | Owning `seller`, `admin` | `{ variants: [{ name, totalStock }] }` |
| Create Payment Order | `POST` | `/api/payments/:orderId` | `buyer` | None |
| List Payment Issues | `GET` | `/api/payments/reconciliation` | `admin` | None |
| Resolve Payment Issue | `PATCH` | `/api/payments/reconciliation/:issueId/resolve` | `admin` | `{ note }` |
| Health & Readiness | `GET` | `/health`, `/ready` | Public | None |

---

## 6. Backend Gap Analysis & Mitigation

1. **Public Catalog Browsing Without Prior Login**:
   - *Current Backend State*: `GET /api/products` and `GET /api/categories` currently require `authMiddleware`.
   - *Frontend Handling*: Frontend automatically attaches token if available. For unauthenticated initial visitors, the frontend provides demo credentials / instant login guest mode, or handles 401 gracefully by prompting login while previewing curated catalog data.
2. **Seller-Specific Aggregations & Analytics**:
   - *Current Backend State*: Backend provides `GET /api/products` and `GET /api/order` without seller-specific summary aggregations (e.g. gross revenue, 30-day sparklines).
   - *Frontend Handling*: The frontend computes metrics from the seller's active products and orders, and provides rich mock telemetry for Stitch BI charts that do not yet have dedicated backend OLAP tables.
3. **Admin Fraud, Moderation & Promotions**:
   - *Current Backend State*: Backend supports full category/product governance, order status overrides, and payment reconciliation issues. There are no backend database models yet for promo coupons (`Coupon`), moderation tickets, or dispute cases.
   - *Frontend Handling*: Frontend implements high-fidelity operational interfaces with local state management, clearly marked as UI capabilities ready for backend microservices.

---

## 7. Implementation Phases

- **Phase 1: Foundation & Design System Setup**
  - Scaffold Vite React TypeScript project in `Frontend_Ecommerce/`.
  - Configure Tailwind with Stitch design tokens, typography, and dark mode.
  - Build reusable UI primitives: Buttons, Badges, Modals, Drawers, Stepper, Tables.
  - Setup centralized API client (`services/api.ts`) with cookie/Bearer credentials and error handling.
  - Setup `AuthContext` and `CartContext`.
- **Phase 2: Buyer Marketplace Screens**
  - Home Marketplace (`/`).
  - Catalog & Search (`/products`).
  - Product Details Page (`/products/:id`).
  - Cart Drawer & Cart Page (`/cart`).
- **Phase 3: Checkout & Order Operations**
  - India-first Multi-step Checkout (`/checkout`).
  - Razorpay payment attempt integration.
  - Order History & Live Tracking (`/orders`, `/orders/:id`).
  - Account Hub (`/account`).
- **Phase 4: Seller Center**
  - Seller Dashboard (`/seller`).
  - Product Creation & Inventory Management (`/seller/products`, `/seller/products/new`, `/seller/inventory`).
  - Orders & Fulfilment Operations (`/seller/orders`, `/seller/fulfilment`).
  - Analytics & Settings (`/seller/analytics`, `/seller/settings`).
- **Phase 5: Platform Admin Operations**
  - Admin Dashboard (`/admin`).
  - Global Catalog & Category Governance (`/admin/products`, `/admin/categories`).
  - Platform-wide Orders & Delivery Overrides (`/admin/orders`).
  - Payment Reconciliation & Dispute Audits (`/admin/payments`).
- **Phase 6: Verification & Quality Assurance**
  - Frontend typecheck (`tsc`), linting, and production build (`vite build`).
  - End-to-end integration with local backend APIs.
  - Regression testing against 38 backend unit/integration tests.

