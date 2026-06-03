# REST API Reference: PACT360

This document outlines the API endpoints exposed by the PACT360 Express backend.

---

## 🔒 Authentication & Headers

All request headers for protected endpoints must include a JWT access token:
```http
Authorization: Bearer <jwt_access_token>
Content-Type: application/json
```

---

## 🔑 Authentication Endpoints

### 1. User Login
* **URL**: `/api/auth/login`
* **Method**: `POST`
* **Request Body**:
  ```json
  {
    "email": "admin@pact360.local",
    "password": "Admin@12345"
  }
  ```
* **Success Response (200)**:
  Returns `accessToken`, `refreshToken`, and user metadata profile.

### 2. Token Refresh
* **URL**: `/api/auth/refresh`
* **Method**: `POST`
* **Request Body**:
  ```json
  {
    "refreshToken": "<refresh_token_string>"
  }
  ```
* **Success Response (200)**:
  Returns new `accessToken`.

---

## 📦 Asset Management Endpoints

### 1. List Assets
* **URL**: `/api/assets`
* **Method**: `GET`
* **Query Parameters**:
  - `search` (name, tag, serial)
  - `categoryId`
  - `officeId`
  - `projectId`
  - `status`
  - `condition`

### 2. Register Asset
* **URL**: `/api/assets`
* **Method**: `POST`
* **Required Headers**: `requirePermission('assets:write')`

### 3. Assign Asset
* **URL**: `/api/assets/:id/assign`
* **Method**: `POST`
* **Request Body**:
  ```json
  {
    "custodianId": "user-uuid-123",
    "conditionOnAssignment": "Good",
    "returnDueDate": "2026-12-31"
  }
  ```

### 4. Transfer Asset
* **URL**: `/api/assets/:id/transfer`
* **Method**: `POST`
* **Request Body**:
  ```json
  {
    "transferType": "Location",
    "destOfficeId": "office-uuid-456",
    "notes": "Relocating for field program deployment."
  }
  ```
* **Required Headers**: `requirePermission('assets:transfer')`

---

## 📁 Reports Endpoint

### 1. Run Report / Download CSV
* **URL**: `/api/system/reports/:reportType`
* **Method**: `GET`
* **Query Parameters**:
  - `format=csv` (Triggers attachment download file)
* **Report Types**:
  - `asset-register`
  - `contracts`
  - `maintenance`
  - `vendors`
  - `audit-logs`
