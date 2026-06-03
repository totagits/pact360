# Deployment Guide

This document maps out deployment instructions for packaging and building **TOTAG PACT360** containers.

## 1. Prerequisites
- Docker installed
- Google Cloud SDK CLI configured
- Node.js 18+

## 2. Local Container Build
```bash
docker build -t totag-pact360:latest .
```

## 3. Google Cloud Run Deployment
```bash
gcloud run deploy pact360 \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="DATABASE_URL=file:/data/pact360.db,JWT_SECRET=super_secret_pact360_token"
```
Ensure a persistent directory `/data` is attached as a volume mount to preserve the SQLite database.
