# Technical Architecture: PACT360 System

This document explains the technical architecture, security design, and system components of **PACT360: Project Asset, Contract, Tracking, and Lifecycle Management System**.

---

## 🏛️ System Design Overview

PACT360 is built as a single-repository monorepo designed for easy execution and single-container deployment:

```
                  ┌──────────────────────────────────────────────┐
                  │                 Vite Client                  │
                  │   React 18 / TS / Tailwind / Recharts        │
                  └──────────────────────┬───────────────────────┘
                                         │ Requests (API queries)
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │               Express Backend                │
                  │         NodeJS / TS / JWT / BCrypt           │
                  └──────────────────────┬───────────────────────┘
                                         │ Prisma ORM
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │               SQLite Database                │
                  │         (Adaptable to PostgreSQL)            │
                  └──────────────────────────────────────────────┘
```

1. **Client SPA (Vite + React)**: Computes routes using React Router DOM. In development, queries are proxied from port `3000` to port `5000`. In production, the built directory `client/dist` is hosted directly as static folder by the Express server.
2. **Server API (Express + Node)**: Protects endpoints via JWT verify interceptors and RBAC middleware. Interacts with the database using Prisma.
3. **Prisma ORM & SQLite**: Provides strict TypeScript schemas and automatic migrations. SQLite is chosen for zero-dependency local running. To scale to a production PostgreSQL database, update the `schema.prisma` provider to `postgresql` and set `DATABASE_URL` to a PostgreSQL connection string.

---

## 🔐 Role-Based Access Control (RBAC)

The security middleware checks both roles and permission codes:
- **Super Admin**: Bypass checks, allowing full access to all endpoints.
- **Other Users**: Must have a role containing the specific permission code mapped to the endpoint.
  - Endpoint check: `requirePermission('assets:write')` verifies the user's JWT payload has `'assets:write'` inside its `permissions` array.

---

## 📝 Security & Audit Trails

To guarantee accountability, every write operation (create, update, delete, assignment, transfer, disposal approval) writes to the `AuditLog` table:
- User operators are captured.
- Action codes are recorded (e.g. `ASSET_ASSIGN`).
- Previous and new states are stored as JSON strings.
- IP Address placeholders are recorded for compliance audits.
