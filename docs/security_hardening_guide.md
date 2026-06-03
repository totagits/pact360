# Security Hardening Guide

This document maps out security best practices for deployments of **PACT360**.

## 1. Network Constraints
- Host Cloud Run revisions behind a Cloud Armor WAF.
- Restrict route ingress to HTTPS only.

## 2. Environment Variables
- Never commit `JWT_SECRET` to version control.
- Bind secrets from Google Secret Manager during Cloud Run revision deployment.

## 3. Database Security
- Restrict read/write permissions of `/data/pact360.db` to the container process owner.
