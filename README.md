# NexBank - Full-Stack Net Banking Simulation

> A production-deployed banking simulation that demonstrates how a modern digital-banking experience can be designed: secure sign-in, account management, beneficiary validation, fund transfers, statements, and administrator controls.

[![Live application](https://img.shields.io/badge/Live%20Application-Open%20NexBank-0F766E?style=for-the-badge&logo=microsoftazure&logoColor=white)](https://nexbank-api-vm.centralindia.cloudapp.azure.com/auth/login)

**🌐 Live Deployment URL:** [https://nexbank-api-vm.centralindia.cloudapp.azure.com/auth/login](https://nexbank-api-vm.centralindia.cloudapp.azure.com/auth/login)

> **Important:** NexBank is a portfolio/learning project and banking simulation. It is not connected to a real financial institution and must not be used with real money or sensitive banking credentials.

## Why NexBank?

NexBank is more than a collection of CRUD screens. It models a complete customer journey—from registration and automatically created savings accounts to beneficiary verification, transfer processing, account statements, and role-based administration—while being deployed as a real full-stack application on Microsoft Azure.

## What you can do

- Create an account and receive a generated savings-account number and IFSC code.
- Sign in securely, refresh a session, sign out, and change a password.
- View account details, balance, transaction history, and profile information.
- Add, validate, and remove beneficiaries.
- Transfer funds via **IMPS** (completed immediately) or **NEFT** (scheduled processing).
- View statements for predefined or custom date ranges and download them as PDF.
- Access a protected administrator dashboard for operational oversight.

## Tech stack

| Area | Technology |
| --- | --- |
| Frontend | Angular 19, TypeScript, SCSS, Angular Material |
| Client state | NgRx Store & Effects, RxJS |
| Backend | Node.js, Express 4 (ES modules) |
| Data | MongoDB with Mongoose |
| Authentication | JWT access/refresh tokens, bcrypt password hashing |
| Cache/session store | Redis, with an in-memory fallback for local development |
| Security | Helmet, CORS allowlist, JWT authentication, RBAC |
| Operations | PM2, Winston logging, graceful shutdown |
| Hosting | Microsoft Azure VM, Caddy-managed HTTPS frontend |

## Architecture

```text
Browser
  | HTTPS
  v
Caddy on Azure VM --> Angular 19 SPA
  |
  +-----------------> Express API (/api/v1) managed by PM2
                              |
                              +-- MongoDB / Mongoose
                              +-- Redis (or local memory-store fallback)
```

The Angular application communicates with the versioned REST API at `/api/v1`; route guards protect authenticated and administrator-only areas. The API applies authentication, authorization, validation, structured error responses, and persistence logic before accessing data services.

## Key engineering details

### Security and access control

- Passwords are hashed with `bcryptjs`; password hashes and refresh tokens are never returned in public user data.
- Access tokens are validated with Bearer authentication; refresh-token rotation supports continued sessions.
- Server-side session expiry is checked on protected requests.
- Customer and administrator routes are separated with role-based middleware and Angular route guards.
- HTTP hardening is applied through Helmet, CORS configuration, body-size limits, and request logging.

### Transfer workflow

1. The customer verifies or selects a beneficiary.
2. The API validates account details, transfer mode, account ownership, and sufficient balance.
3. A transaction is created with a unique NexBank reference ID.
4. IMPS transfers complete immediately; NEFT transfers are created as pending and processed on schedule.
5. Debit/credit account balances and transaction status are updated together by the transfer workflow.

### Statements

Statement data can be previewed by date range and exported as a generated PDF containing account metadata, transaction references, transfer directions, and closing information.

## Repository structure

```text
.
├── nexbank-frontend/          # Angular single-page application
│   └── src/app/
│       ├── core/              # API services, guards, interceptor
│       ├── features/          # Auth, dashboard, transfer, statements, admin
│       └── store/             # NgRx authentication state
└── nexbank-backend/           # Express REST API
    └── src/
        ├── controllers/       # Request handling and business workflows
        ├── models/            # Mongoose schemas
        ├── routes/            # Versioned API endpoints
        ├── middlewares/       # Auth and admin authorization
        ├── services/          # Authentication and setup logic
        └── config/            # Database, cache, and logging setup
```

## API at a glance

All application endpoints are versioned beneath `/api/v1`.

| Resource | Example endpoints | Access |
| --- | --- | --- |
| Authentication | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` | Public / authenticated as applicable |
| Account | `GET /accounts/me` | Authenticated |
| Beneficiaries | `GET/POST /beneficiaries`, `DELETE /beneficiaries/:id` | Authenticated |
| Transactions | `GET /transactions`, `POST /transactions/transfer` | Authenticated |
| Statements | `POST /transactions/statement`, `/statement/view` | Authenticated |
| Administration | `GET /admin/overview`, `/admin/operations` | Administrator |
| Health | `GET /health` | Public |

For protected API requests, include:

```http
Authorization: Bearer <access-token>
```

## Run locally

### Prerequisites

- Node.js 20 or newer
- npm
- MongoDB connection string (MongoDB Atlas or local MongoDB)
- Redis is optional; the backend falls back to an in-memory store when it is disabled or unavailable

### 1. Start the backend

```bash
cd nexbank-backend
npm install
cp .env.example .env
```

Set the required values in `.env`:

```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/nexbank
JWT_ACCESS_SECRET=<use-a-long-random-secret>
JWT_REFRESH_SECRET=<use-a-different-long-random-secret>
CLIENT_URL=http://localhost:4200
REDIS_ENABLED=false
```

Then run:

```bash
npm run dev
```

The API health check will be available at `http://localhost:4000/health`.

### 2. Start the frontend

In another terminal:

```bash
cd nexbank-frontend
npm install
npm start
```

Open `http://localhost:4200`.

The development environment points to `http://localhost:4000/api/v1`. Production builds use the deployed Azure API URL configured in the frontend environment file.

## Production deployment

NexBank is deployed on a **Microsoft Azure VM**:

- **Frontend:** Angular production build served over HTTPS through **Caddy**.
- **Backend:** Node.js/Express API kept online with **PM2**.
- **Public application:** [nexbank-api-vm.centralindia.cloudapp.azure.com](https://nexbank-api-vm.centralindia.cloudapp.azure.com/auth/login)

This separation keeps frontend delivery and backend process lifecycle management clear, while HTTPS is handled at the web-server layer.

## Quality checks

```bash
# Backend
cd nexbank-backend
npm run lint

# Frontend production build
cd ../nexbank-frontend
npm run build
```

## Author

Built by [Pranav](https://github.com/pranav-0504) as a full-stack banking-platform portfolio project.

---

If you are reviewing this repository, start with the [live application](https://nexbank-api-vm.centralindia.cloudapp.azure.com/auth/login), then explore the Angular feature modules and Express API workflows to see how the end-to-end experience is put together.
