# Security Incident Response Guide

This document describes standard operating procedures for identifying, mitigating, and responding to cyber incidents inside **TOTAG PACT360**.

## 1. Identification
- **Indications**: High volume of failed login audits, unauthorized privilege escalation attempts logged in `AuditLog` table.
- **Reporting**: System administrators monitor error monitoring dashboard and audit log exports.

## 2. Containment
- **Suspected User Accounts**: Change status in user record to "Suspended" immediately. Suspended users are rejected by JWT middleware.
- **Session Revocation**: Revoke active JWT tokens or recycle the JWT signing key `JWT_SECRET` in environment variables.

## 3. Eradication & Recovery
- Apply code patches for vulnerabilities.
- Restore clean SQLite backup to verify data integrity.
