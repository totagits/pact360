# Database Admin Runbook

This guide covers operational commands and structural checks for the SQLite relational backend.

## 1. Schema Sync
To update changes from `schema.prisma` to the live database file:
```bash
npx prisma db push
```

## 2. Seed Database
To clean and seed the database with all 16 default roles, permissions, asset category prefixes, and sandbox mock datasets:
```bash
npm run db:seed
```

## 3. SQLite Integrity Check
```bash
sqlite3 pact360.db "PRAGMA integrity_check;"
```
Output must return `ok`.
