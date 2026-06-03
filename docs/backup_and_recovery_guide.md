# TOTAG PACT360: Backup and Recovery Guide

This document describes the backup protocols and disaster recovery mechanisms for **TOTAG PACT360** production deployment.

## Backup Process

- **Location**: Database SQLite file `/data/pact360.db` (persistent disk mount).
- **Automation**: Daily cron job scripts at 01:00 UTC copy sqlite files to a write-only Google Cloud Storage bucket `gs://lbr-pact360-backups`.
- **Retention**: 90 days.

## Database Recovery Steps

1. Stop application server:
   ```bash
   gcloud run services update pact360 --concurrency 1 ...
   ```
2. Retrieve backup file from Google Cloud Storage:
   ```bash
   gsutil cp gs://lbr-pact360-backups/pact360-2026-06-03.db /data/pact360.db
   ```
3. Run schema verification check:
   ```bash
   npx prisma db push
   ```
4. Restart application server:
   ```bash
   gcloud run services update pact360 ...
   ```
