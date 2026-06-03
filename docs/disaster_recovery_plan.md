# Disaster Recovery Plan

This document outlines the business continuity and disaster recovery (DR) protocols for **PACT360**.

## Recovery Time Objective (RTO)
Maximum acceptable duration of downtime: **12 hours**.

## Recovery Point Objective (RPO)
Maximum acceptable data loss: **24 hours** (data from the last daily backup).

## Disaster Scenarios & Mitigation

### Scenario A: Cloud Provider Zone Failure
- **Mitigation**: Deploy the docker container in another available zone in `us-central1` or another region (e.g. `us-east1`) and mount the backup SQLite file.

### Scenario B: Database Corruption
- **Mitigation**: Revert to the latest daily snapshot in Google Cloud Storage. Run integrity checks before pointing service traffic back.
