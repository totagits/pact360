# Monitoring and Alerts Guide

This guide covers logging formats and monitoring setups for the application.

## 1. Application Logs
All server requests and errors are printed to stdout, which is collected by Google Cloud Logging.
Look for JSON formatted logs:
- `timestamp`: Event creation date.
- `userId`: User execution context.
- `action`: API controller event.

## 2. Setting Up Alerts in Cloud Console
1. Navigate to **Google Cloud Console ➔ Logging ➔ Logs Router**.
2. Create a log-based metric for errors:
   `resource.type="cloud_run_revision" severity>=ERROR`
3. Configure alert notifications via email or Slack when the error rate exceeds 5 per minute.
