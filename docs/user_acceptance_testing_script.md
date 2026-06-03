# User Acceptance Testing (UAT) Script

This document contains testing scripts for key features of PACT360.

## Test Case 1: Dynamic Rebranding
- **Action**: Go to System Configurations settings tab. Change app name to "Plan Liberia PACT" and theme color to `#dc2626` (Red). Click Save.
- **Expected Outcome**: Side navigation app header updates instantly to "Plan Liberia PACT" and background color of selected tabs changes to red.

## Test Case 2: Rollback Import
- **Action**: Import a CSV file, verify rows preview validation, commit batch. Go to batch history list, click Rollback.
- **Expected Outcome**: Batch status shows "Rolled Back" and all imported items are removed from the active register.
