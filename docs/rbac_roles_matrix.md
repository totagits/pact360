# RBAC Roles and Permissions Matrix

This document maps out permission scopes assigned to user roles.

## Role Table

| Role | Permissions | Description |
|------|-------------|-------------|
| **Super Admin** | Bypass all checks | Global console settings. |
| **Head of Operations** | `assets:transfer`, `assets:dispose` | Authorizes disposals and transfers. |
| **Asset Manager** | `assets:read`, `assets:write`, `assets:assign` | Registers and assigns hardware. |
| **Contract Manager** | `contracts:read`, `contracts:write` | Drafts and registers agreements. |
| **Grants Manager** | `projects:read`, `projects:write` | Links budgets to grants. |
| **Auditor** | `audit:read`, `reports:read` | Reviews compliance. |
| **Field Office User** | `assets:read` | Read-only inventory checking. |
