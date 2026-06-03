# Troubleshooting Playbook

This document covers operational solutions for common support requests.

## Issue 1: "Incorrect password or email" during logon
- **Action**: Check if status is "Suspended" in sqlite. If not, reset user credentials:
  ```bash
  sqlite3 pact360.db "UPDATE User SET passwordHash = '...' WHERE email = '...'"
  ```

## Issue 2: Custom rebranding color didn't apply
- **Action**: Reload browser cache. If styling element `dynamic-brand-styles` is not inserted in the head tag, check the console output of the settings API fetch.
