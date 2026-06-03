# Compliance Checklist

This document covers regulatory, security, and donor compliance check steps.

## Security Controls
- [x] All API endpoints require JWT authorization.
- [x] Passwords stored as Bcrypt hashes.
- [x] Suspended users blocked dynamically at route level.

## Donor Constraints
- [x] Assets linked to specific Grants and projects budget codes.
- [x] Useful life straight-line depreciation calculated daily.
- [x] Soft-delete (retirement) prevents records from being deleted from history.
