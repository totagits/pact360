# PACT360: Project Asset, Contract, Tracking, and Lifecycle Management System

PACT360 is an enterprise-grade, secure, modern, and product-ready web application designed for Plan International Liberia. It simplifies tracking capital assets, scheduling maintenance work orders, auditing long-term contracts, and mapping everything directly to donor-funded grants and project codes.

---

## 🚀 Quick Start & Local Setup

Ensure you have [Node.js v20+](https://nodejs.org) installed on your system.

### 1. Install All Dependencies
From the root directory, run the monorepo setup task:
```bash
npm run install:all
```
This automatically runs `npm install` inside both the `/client` and `/server` subfolders.

### 2. Configure Environment Variables
Copy the template `.env.example` file to `.env` in both the root and `/server` directory:
```bash
cp .env.example .env
cp .env.example server/.env
```

### 3. Generate Database Models & Seed Data
Initialize the SQLite database with the full schema and run the demo seed script (populating 100+ assets, 20+ contracts, 25+ maintenance logs, and 50+ security audit records):
```bash
npm run db:migrate
npm run db:seed
```

### 4. Run the Application in Development Mode
Launch the concurrent hot-reload servers (Vite on port `3000`, Express on port `5000`):
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to view the application.

---

## 🔐 Sandbox Demo Accounts

Use these seeded login profiles to test different RBAC validation rules:

| Role | Username / Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@pact360.local` | `Admin@12345` |
| **Asset Manager** | `asset.manager@pact360.local` | `Asset@12345` |
| **Contract Manager** | `contract.manager@pact350.local` | `Contract@12345` |
| **Project Manager** | `project.manager@pact360.local` | `Project@12345` |
| **Auditor** | `auditor@pact360.local` | `Auditor@12345` |

---

## 🐳 Docker Deployment

To build and run PACT360 as a single-container production-grade service:

### 1. Build the Docker Image
```bash
docker build -t pact360:latest .
```

### 2. Run the Container
```bash
docker run -d -p 5000:5000 --name pact360_app pact360:latest
```
Visit **[http://localhost:5000](http://localhost:5000)**. The container compiles the Vite static frontend, hosts it via the Express backend, automatically sets up SQLite, seeds demo data, and serves everything on port `5000`.

---

## ☁️ Google Cloud Run Deployment

To deploy this container directly to GCP Cloud Run:

```bash
# 1. Login and configure gcloud
gcloud auth login
gcloud config set project sba-msme-portal-lr

# 2. Deploy directly from local source
gcloud run deploy pact360 \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

---

## 💻 Replit Deployment

To run PACT360 on Replit:
1. Import the repository URL.
2. In Replit's environment variables dashboard, set `NODE_ENV=production` and `PORT=5000`.
3. Set the run command to:
   ```bash
   npm run install:all && npm run build && npm start
   ```
4. Click **Run** to launch.
