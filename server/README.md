# Egypt Supply Chain Visibility (ESCV) — Server

> NestJS backend for the Egypt Supply Chain Visibility Platform.

<div align="center">
  <img src="../docs/assets/escv-logo.png" alt="ESCV Logo" width="800" />
</div>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Setup](#environment-setup)
- [Installation](#installation)
- [Prisma Setup](#prisma-setup)
  - [Schema Translation Reference](#schema-translation-reference)
  - [Running Migrations](#running-migrations)
  - [Seeding the Database](#seeding-the-database)
- [Running the Server](#running-the-server)
- [Implemented Modules](#implemented-modules)
  - [Auth Module](#auth-module)
  - [Users Module](#users-module)
  - [Organizations Module](#organizations-module)
  - [Shipments Module](#shipments-module)
  - [Admin Module](#admin-module)
  - [Mail Module](#mail-module)
  - [Queue Module](#queue-module)
  - [Redis Module](#redis-module)
  - [Prisma Module](#prisma-module)
- [API Design](#api-design)
  - [Design Principles](#design-principles)
  - [Base URL and Versioning](#base-url-and-versioning)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Organizations Endpoints](#organizations-endpoints)
  - [Users Endpoints](#users-endpoints)
  - [Shipments Endpoints](#shipments-endpoints)
  - [Admin Endpoints](#admin-endpoints)
  - [Alerts Endpoints](#alerts-endpoints)
  - [Dashboard Endpoints](#dashboard-endpoints)
  - [Reports Endpoints](#reports-endpoints)
  - [Audit Endpoints](#audit-endpoints)
  - [Health Endpoints](#health-endpoints)
  - [WebSocket Events](#websocket-events)
- [Request and Response Flow](#request-and-response-flow)
- [Validation and Security](#validation-and-security)
- [Module Responsibilities](#module-responsibilities)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [License](#license)

---

## Overview

The ESCV server is a production-grade **NestJS modular monolith** that powers the national supply chain visibility platform. It exposes a versioned REST API, a real-time WebSocket gateway, a mail delivery system, and an async job queue for invitation emails and background processing.

Every business feature is isolated in its own NestJS module. Modules communicate through NestJS's built-in event system — no external message broker required at this scale.

**What's live today:**

- JWT authentication with access and refresh token rotation
- Role-based access control across Admin, Shipper, Carrier, and Regulator roles
- Organization management with member directory
- User management with organization context
- Full shipment lifecycle with state machine enforcement
- Continuous GPS location updates via self-transition support
- Invitation system with async email delivery via BullMQ
- Redis integration for caching and queue backend
- Admin module initialization

---

## Architecture

```
Client (React)
      │
      ▼
NestJS API — Modular Monolith
      │
      ├── REST Controllers → Guards → Pipes → Services → Repositories → Prisma → PostgreSQL
      │
      ├── WebSocket Gateway → Socket.IO → Shipment Rooms
      │
      └── BullMQ Workers → Redis → Invitation Emails → Mail Module → SMTP
```

**Request pipeline:**

```
Inbound HTTP Request
        │
        ▼
Global Middleware        helmet · compression · pino logger · request-id stamp
        │
        ▼
ThrottlerGuard           100 requests / 60 seconds per IP → 429 if exceeded
        │
        ▼
JwtAuthGuard             verify Bearer token → attach req.user → 401 if invalid
        │
        ▼
RolesGuard               check @Roles() decorator against req.user.role → 403 if denied
        │
        ▼
ValidationPipe           validate DTO · strip unknown fields · 400 if invalid
        │
        ▼
Controller               route handler — zero business logic
        │
        ▼
Service                  all business logic · emit domain events
        │
        ▼
Repository               all Prisma queries · service never writes raw queries
        │
        ▼
PostgreSQL
```

---

## Prerequisites

| Tool | Version | Purpose | Install |
|---|---|---|---|
| **Node.js** | 20.x LTS | JavaScript runtime | [nodejs.org](https://nodejs.org) |
| **npm** | 10.x | Package manager | Included with Node |
| **NestJS CLI** | Latest | Scaffolding | `npm i -g @nestjs/cli` |
| **PostgreSQL** | 16.x | Primary database | [postgresql.org](https://www.postgresql.org) |
| **Redis** | 7.x | Queue and cache backend | [redis.io](https://redis.io) |
| **Docker** | Latest | Containerized services | [docker.com](https://www.docker.com) |
| **Git** | Latest | Version control | [git-scm.com](https://git-scm.com) |
| **Postman / Bruno** | Latest | API testing | [postman.com](https://www.postman.com) |

**Recommended VS Code extensions:**

```
Prisma
ESLint
Prettier
REST Client
GitLens
DotENV
```

---

## Tech Stack

| Technology | Purpose | Version |
|---|---|---|
| ![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white) | Backend Framework | 10.x |
| ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) | Language | 5.x |
| ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white) | Primary Database | 16.x |
| ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white) | ORM + Migrations | 6.x |
| ![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white) | Cache + Queue Backend | 7.x |
| ![BullMQ](https://img.shields.io/badge/BullMQ-FF6B35?style=for-the-badge&logoColor=white) | Async Job Queue | 5.x |
| ![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white) | Real-time WebSocket | 4.x |
| ![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white) | Authentication | 9.x |
| ![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black) | API Documentation | 7.x |
| ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white) | Containerization | Latest |

---

## Project Structure

```
server/
│
├── src/
│   │
│   ├── auth/                         # JWT auth · login · register · refresh · logout
│   │   ├── controllers/
│   │   │   └── auth.controller.ts
│   │   ├── services/
│   │   │   └── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── jwt-refresh.strategy.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   ├── register.dto.ts
│   │   │   └── refresh-token.dto.ts
│   │   └── auth.module.ts
│   │
│   ├── users/                        # User CRUD · organization context in responses
│   │   ├── controllers/
│   │   │   └── users.controller.ts
│   │   ├── services/
│   │   │   └── users.service.ts
│   │   ├── repositories/
│   │   │   └── users.repository.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   └── update-user.dto.ts
│   │   └── users.module.ts
│   │
│   ├── organizations/                # Organization CRUD · member directory endpoint
│   │   ├── controllers/
│   │   │   └── organizations.controller.ts
│   │   ├── services/
│   │   │   └── organizations.service.ts
│   │   ├── repositories/
│   │   │   └── organizations.repository.ts
│   │   ├── dto/
│   │   │   ├── create-organization.dto.ts
│   │   │   └── update-organization.dto.ts
│   │   └── organizations.module.ts
│   │
│   ├── shipments/                    # Shipment lifecycle · state machine · GPS tracking
│   │   ├── controllers/
│   │   │   └── shipments.controller.ts
│   │   ├── services/
│   │   │   └── shipments.service.ts
│   │   ├── repositories/
│   │   │   └── shipments.repository.ts
│   │   ├── dto/
│   │   │   ├── create-shipment.dto.ts
│   │   │   ├── update-shipment.dto.ts
│   │   │   └── shipment-filters.dto.ts
│   │   ├── enums/
│   │   │   └── shipment-status.enum.ts
│   │   ├── events/
│   │   │   └── shipment-status-changed.event.ts
│   │   └── shipments.module.ts
│   │
│   ├── admin/                        # Admin module — platform management (initialized)
│   │   ├── controllers/
│   │   │   └── admin.controller.ts
│   │   ├── services/
│   │   │   └── admin.service.ts
│   │   └── admin.module.ts
│   │
│   ├── mail/                         # Mail module · SMTP · invitation email templates
│   │   ├── mail.module.ts
│   │   └── mail.service.ts
│   │
│   ├── queue/                        # BullMQ queue · invitation email consumer
│   │   ├── queue.module.ts
│   │   └── queue.consumer.ts
│   │
│   ├── redis/                        # Redis module · ioredis client · cache service
│   │   ├── redis.module.ts
│   │   └── redis.service.ts
│   │
│   ├── prisma/                       # Global Prisma client — modern engine config
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   │
│   ├── common/
│   │   └── decorators/               # @CurrentUser() · @Roles() · @Public()
│   │
│   ├── config/                       # Typed env config · secrets · JWT config
│   │
│   ├── types/                        # Global TypeScript interfaces · user interface fix
│   │
│   ├── app.controller.ts
│   ├── app.module.ts                 # Root module — all feature modules registered
│   ├── app.service.ts
│   └── main.ts                       # Entry point · global pipes · swagger · cors
│
├── prisma/
│   ├── schema.prisma                 # 12-table schema + invitation table
│   ├── migrations/
│   └── seed.ts
│
├── test/
│   └── app.controller.spec.ts
│
├── .env                              # Local environment variables (never commit)
├── .env.example                      # Environment template (always commit)
├── .gitignore
├── .prettierrc
├── eslint.config.mjs
├── nest-cli.json
├── package.json
└── README.md
```

---

## Environment Setup

### Step 1 — Copy the environment template

```bash
cp .env.example .env
```

### Step 2 — Fill in your `.env`

```env
# ── Application ────────────────────────────────────────
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:5173

# ── Database ───────────────────────────────────────────
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/escv_db"

# ── Redis ──────────────────────────────────────────────
REDIS_URL="redis://localhost:6379"

# ── JWT ────────────────────────────────────────────────
JWT_SECRET="your-64-byte-random-access-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-64-byte-random-refresh-secret"
JWT_REFRESH_EXPIRES_IN="7d"

# ── Mail (SMTP) ────────────────────────────────────────
MAIL_HOST="smtp.your-provider.com"
MAIL_PORT=587
MAIL_USER="your-email@domain.com"
MAIL_PASS="your-smtp-password"
MAIL_FROM="noreply@escv.eg"
```

> `.env` is in `.gitignore`. Never commit it. Only `.env.example` with empty values goes to the repository.

Generate secure secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Installation

### Step 1 — Scaffold the project

```bash
npm install -g @nestjs/cli
nest new server
cd server
```

Choose **npm** when prompted.

### Step 2 — Install all dependencies

```bash
# Configuration and validation
npm install @nestjs/config joi

# Validation
npm install class-validator class-transformer

# Authentication
npm install @nestjs/passport @nestjs/jwt passport passport-jwt bcrypt
npm install -D @types/bcrypt @types/passport-jwt

# Database
npm install @prisma/client
npm install -D prisma

# Redis and queue
npm install ioredis @nestjs/bullmq bullmq

# WebSockets
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io

# Mail
npm install @nestjs-modules/mailer nodemailer
npm install -D @types/nodemailer

# Swagger
npm install @nestjs/swagger swagger-ui-express

# Security middleware
npm install helmet compression cookie-parser
npm install -D @types/cookie-parser @types/compression

# Logging
npm install nestjs-pino pino-http
npm install -D pino-pretty

# Rate limiting
npm install @nestjs/throttler

# Health checks
npm install @nestjs/terminus

# Utilities
npm install dayjs uuid
npm install -D @types/uuid

# Testing
npm install -D supertest @types/supertest
```

### Step 3 — Create the folder structure

```bash
cd src
mkdir -p auth/controllers auth/services auth/strategies auth/guards auth/dto
mkdir -p users/controllers users/services users/repositories users/dto
mkdir -p organizations/controllers organizations/services organizations/repositories organizations/dto
mkdir -p shipments/controllers shipments/services shipments/repositories shipments/dto shipments/enums shipments/events
mkdir -p admin/controllers admin/services
mkdir -p mail queue redis prisma
mkdir -p common/decorators config types
```

---

## Prisma Setup

Prisma reads `schema.prisma` and generates a fully-typed TypeScript client. Every database query in the application goes through this client — no raw SQL in service or controller files.

### Initialize Prisma

```bash
npx prisma init
```

> **Prisma 6+ note:** If you are on Prisma 6 or later and see an error about `url` in `schema.prisma`, move the connection string to `prisma.config.ts` and install the adapter:
>
> ```bash
> npm install @prisma/adapter-pg pg
> npm install -D @types/pg
> ```

### Schema Translation Reference

| SQL | Prisma |
|---|---|
| `UUID PRIMARY KEY DEFAULT gen_random_uuid()` | `String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid` |
| `VARCHAR(255) NOT NULL` | `String @db.VarChar(255)` |
| `TEXT` | `String` |
| `BOOLEAN NOT NULL DEFAULT true` | `Boolean @default(true)` |
| `TIMESTAMPTZ NOT NULL DEFAULT NOW()` | `DateTime @default(now()) @db.Timestamptz()` |
| `TIMESTAMPTZ` nullable | `DateTime? @db.Timestamptz()` |
| `NUMERIC(10, 2)` | `Decimal? @db.Decimal(10, 2)` |
| `INTEGER` | `Int` |
| `JSONB` | `Json?` |
| `INET` | `String?` |
| `REFERENCES table(col)` | `@relation(fields: [...], references: [...])` |
| `@@map("table_name")` | Maps model to exact database table name |

### Running Migrations

```bash
# Create the database (run once)
psql -U postgres -c "CREATE DATABASE escv_db;"

# Apply the schema and generate migration files
npx prisma migrate dev --name init

# Regenerate the TypeScript client after schema changes
npx prisma generate

# Open the visual database browser
npx prisma studio
```

### Seeding the Database

```bash
npx prisma db seed
```

Add this to `package.json`:

```json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```

---
## Running the Server

```bash
# Development — auto-restart on file change
npm run start:dev

# Production build
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

Verify the server is running:

```js
GET http://localhost:3000/api/v1/health   →  200 OK
GET http://localhost:3000/api/docs        →  Swagger UI
```

---

## Implemented Modules
This section documents every module that has been built and merged into the repository.

---
### Auth Module

**Location:** `src/auth/`
Handles the complete authentication lifecycle — registration, login, token refresh, logout, and current user retrieval.

**What's implemented:**
- `POST /auth/register` — creates a new user, hashes password with bcrypt, returns token pair
- `POST /auth/login` — validates credentials, issues access token (15m) and refresh token (7d)
- `POST /auth/refresh` — validates refresh token, rotates it, issues new token pair
- `POST /auth/logout` — invalidates the refresh token from the database
- `GET /auth/me` — returns the authenticated user's profile including organization details

**Key decisions:**
Access tokens are short-lived at 15 minutes. Refresh tokens are stored as bcrypt hashes in the `refresh_token` table and rotated on every use — if a stolen token is used twice, the second attempt fails and the session is invalidated.

---
### Users Module

**Location:** `src/users/`
Manages user records. Organization details are included in authentication responses so the frontend does not need a separate call to fetch organization context after login.

**What's implemented:**
- User lookup by ID and email
- Organization context embedded in user responses
- User role retrieval for guard enforcement

---
### Organizations Module
**Location:** `src/organizations/`

Manages organization records and exposes the member directory endpoint.

**What's implemented:**
- `GET /organizations` — list all organizations (Admin, Regulator)
- `GET /organizations/:id` — organization detail
- `POST /organizations` — create organization (Admin)
- `PATCH /organizations/:id` — update organization (Admin)
- `PATCH /organizations/:id/deactivate` — soft deactivate (Admin)
- `GET /organizations/:id/members` — fetch full member directory for an organization

---
### Shipments Module
**Location:** `src/shipments/`

Manages the complete shipment lifecycle with a state machine enforcing valid status transitions. Supports continuous GPS location updates through self-transitions.

**What's implemented:**
- Full CRUD for shipments
- State machine with all valid transitions between statuses
- Self-transitions enabled so a carrier can continuously push GPS coordinates while a shipment remains `in_transit` without being blocked by the transition guard
- Role-based data filtering — shippers see only their own shipments, carriers see only assigned shipments, regulators and admins see everything

**Valid status transitions:**

```js
draft         → confirmed
confirmed     → picked_up
picked_up     → in_transit
in_transit    → in_transit      (self — GPS location update)
in_transit    → at_checkpoint
in_transit    → customs_hold
in_transit    → delayed
at_checkpoint → in_transit
at_checkpoint → customs_hold
customs_hold  → customs_cleared
customs_cleared → in_transit
in_transit    → out_for_delivery
out_for_delivery → delivered
* → cancelled
```

---
### Admin Module
**Location:** `src/admin/`

Platform-wide administration. Initialized and registered in `app.module.ts`.

**Status:** Module initialized. Feature endpoints being developed.

**Planned scope:**
- Platform statistics and KPIs
- User management across all organizations
- Organization approval and deactivation
- System-wide audit log access

---
### Mail Module
**Location:** `src/mail/`

Handles all outbound email using SMTP. Currently used by the Queue module to send invitation emails asynchronously.

**What's implemented:**
- SMTP connection configured via environment variables
- Mail service injectable across modules
- Invitation email template

---
### Queue Module

**Location:** `src/queue/`
BullMQ-powered async job queue backed by Redis. Decouples email delivery from the request cycle — invitation emails are queued and processed by the consumer without blocking the API response.

**What's implemented:**
- Queue module and BullMQ configuration
- Invitation email consumer — picks jobs off the queue and calls the Mail service
- Queue registration in `app.module.ts`

---
### Redis Module
**Location:** `src/redis/`
Global Redis client using `ioredis`. Provides a shared `RedisService` injectable anywhere in the application for caching, queue backend, and future session management.

**What's implemented:**
- Redis module with `ioredis` client
- `RedisService` with `get`, `set`, `del`, and `expire` methods
- Global module — no need to re-import in feature modules

---
### Prisma Module
**Location:** `src/prisma/`
Global database client module. `PrismaService` extends `PrismaClient` and manages the connection lifecycle with `onModuleInit` and `onModuleDestroy`. Configured to work with the modern Prisma engine.

**What's implemented:**
- `PrismaService` with connection lifecycle hooks
- `@Global()` module — imported once in `AppModule`, available everywhere
- Compatible with Prisma 6+ adapter configuration

---
## API Design
### Design Principles
Every endpoint follows these rules without exception.

**Versioned routes** — every endpoint lives under `/api/v1/`. Breaking changes introduce `/api/v2/` without removing the previous version.

**Plural nouns, never verbs:**
```js
✓  GET /api/v1/shipments
✗  GET /api/v1/getShipments
```

**Nested routes for resource ownership:**
```js
GET  /api/v1/shipments/:id/events
POST /api/v1/shipments/:id/events
GET  /api/v1/organizations/:id/members
```

**HTTP verbs carry meaning:**
```js
GET     read only, never mutates state
POST    create a new resource
PATCH   update specific fields of an existing resource
PUT     replace a resource entirely
DELETE  remove or deactivate
```

**Consistent response envelope** — every response, success or error, returns this shape:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "SHIPMENT_NOT_FOUND",
    "message": "Shipment with id abc-123 does not exist.",
    "statusCode": 404
  }
}
```

**Pagination on every list endpoint:**
```js
GET /api/v1/shipments?page=1&limit=20&status=in_transit
```

---
### Base URL and Versioning
```js
Development:   http://localhost:3000/api/v1
Swagger UI:    http://localhost:3000/api/docs
```

---
### Authentication Endpoints
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/auth/register` | ✗ | — | Register new user account |
| `POST` | `/auth/login` | ✗ | — | Login and receive token pair |
| `POST` | `/auth/refresh` | ✗ | — | Rotate refresh token, receive new pair |
| `POST` | `/auth/logout` | ✓ | Any | Invalidate current refresh token |
| `GET` | `/auth/me` | ✓ | Any | Fetch current user profile with organization |
| `PUT` | `/auth/me/password` | ✓ | Any | Change own password |

**Register body:**
```json
{
  "user_first_name": "Ahmed",
  "user_last_name": "Medhat",
  "user_email": "ahmed@escv.eg",
  "user_password": "SecurePass123!",
  "user_phone": "+201234567890",
  "organization_id": "uuid-here"
}
```

**Login response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "user": {
      "user_id": "uuid",
      "user_email": "ahmed@escv.eg",
      "user_role": "shipper",
      "user_first_name": "Ahmed",
      "organization": {
        "organization_id": "uuid",
        "organization_name": "Maersk Egypt"
      }
    }
  }
}
```

---
### Organizations Endpoints
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/organizations` | ✓ | Admin, Regulator | List all organizations |
| `GET` | `/organizations/:id` | ✓ | Admin, Regulator | Organization detail |
| `POST` | `/organizations` | ✓ | Admin | Create organization |
| `PATCH` | `/organizations/:id` | ✓ | Admin | Update organization |
| `PATCH` | `/organizations/:id/deactivate` | ✓ | Admin | Deactivate organization |
| `GET` | `/organizations/:id/members` | ✓ | Admin | Organization member directory |

---
### Users Endpoints
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/users` | ✓ | Admin | List all users |
| `GET` | `/users/:id` | ✓ | Admin | User detail |
| `POST` | `/users` | ✓ | Admin | Create user |
| `PATCH` | `/users/:id` | ✓ | Admin | Update user |
| `PATCH` | `/users/:id/deactivate` | ✓ | Admin | Deactivate user |

---
### Shipments Endpoints
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/shipments` | ✓ | All | List shipments — role-filtered automatically |
| `GET` | `/shipments/:id` | ✓ | All | Shipment detail |
| `POST` | `/shipments` | ✓ | Shipper, Admin | Create shipment |
| `PATCH` | `/shipments/:id` | ✓ | Shipper, Admin | Update shipment metadata |
| `PATCH` | `/shipments/:id/status` | ✓ | Carrier, Admin | Transition shipment status |
| `PATCH` | `/shipments/:id/location` | ✓ | Carrier | Push GPS coordinates (self-transition) |
| `PATCH` | `/shipments/:id/assign-carrier` | ✓ | Admin | Assign carrier organization |
| `DELETE` | `/shipments/:id` | ✓ | Admin | Cancel shipment |
| `GET` | `/shipments/:id/events` | ✓ | All | Full append-only event timeline |
| `GET` | `/shipments/:id/alerts` | ✓ | All | Alerts linked to this shipment |

**Query parameters:**
```
GET /api/v1/shipments?status=in_transit&page=1&limit=20&origin_city=Alexandria
```

**Status update body:**
```json
{
  "shipment_status": "at_checkpoint",
  "checkpoint_id": "uuid-of-checkpoint",
  "event_description": "Arrived at Alexandria Port Gate 3",
  "event_latitude": 31.2001,
  "event_longitude": 29.9187
}
```

---
### Admin Endpoints
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/admin/stats` | ✓ | Admin | Platform-wide KPI statistics |
| `GET` | `/admin/users` | ✓ | Admin | All users across all organizations |
| `PUT` | `/admin/users/:id/role` | ✓ | Admin | Change user role |
| `DELETE` | `/admin/users/:id` | ✓ | Admin | Remove user from platform |
| `GET` | `/admin/organizations` | ✓ | Admin | All organizations |
| `GET` | `/admin/audit` | ✓ | Admin | Platform audit log |

---
### Alerts Endpoints
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/alerts` | ✓ | All | Alerts for the current user |
| `GET` | `/alerts/unread-count` | ✓ | All | Count of unread alerts |
| `GET` | `/alerts/:id` | ✓ | All | Alert detail |
| `PATCH` | `/alerts/:id/read` | ✓ | All | Mark alert as read |
| `PATCH` | `/alerts/:id/resolve` | ✓ | Admin, Regulator | Mark alert as resolved |

---
### Dashboard Endpoints
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/dashboard/stats` | ✓ | All | KPI statistics — role-filtered |
| `GET` | `/dashboard/shipments/map` | ✓ | All | Active shipments with coordinates |
| `GET` | `/dashboard/ports/load` | ✓ | Regulator, Admin | Shipment count per checkpoint |
| `GET` | `/dashboard/carrier/performance` | ✓ | Admin, Regulator | Carrier delivery performance |

---
### Reports Endpoints
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/reports` | ✓ | Admin, Regulator | Request async report generation |
| `GET` | `/reports` | ✓ | Admin, Regulator | List all reports |
| `GET` | `/reports/:id` | ✓ | Admin, Regulator | Report status and download link |

Reports are generated asynchronously. The API returns `report_status: "pending"` immediately. A BullMQ worker processes the job. The client receives a `report:ready` WebSocket event when generation completes.

---
### Audit Endpoints
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/audit` | ✓ | Admin | Browse audit log |
| `GET` | `/audit?resource_type=shipment&resource_id=uuid` | ✓ | Admin | Audit trail for a resource |
| `GET` | `/audit?user_id=uuid` | ✓ | Admin | Audit trail for a user |

Audit logs are read-only. There are no write endpoints.

---
### Health Endpoints
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | ✗ | Overall application health |
| `GET` | `/health/db` | ✗ | Database connectivity |
| `GET` | `/health/redis` | ✗ | Redis connectivity |

---
### WebSocket Events
Connect to `ws://localhost:3000` with a valid JWT Bearer token in the handshake headers.

**Client → Server:**
| Event | Payload | Description |
|---|---|---|
| `join:shipment` | `{ shipmentId: string }` | Subscribe to a shipment room |
| `leave:shipment` | `{ shipmentId: string }` | Unsubscribe from a shipment room |
| `join:dashboard` | `{ role: string }` | Subscribe to role-based dashboard feed |

**Server → Client:**

| Event | Payload | Description |
|---|---|---|
| `shipment:updated` | `{ shipmentId, status, coordinates, timestamp }` | Status or location changed |
| `alert:new` | `{ alertId, type, severity, message, shipmentId }` | New alert for this user |
| `dashboard:stats` | `{ activeShipments, delayed, portLoad }` | Periodic KPI broadcast |
| `report:ready` | `{ reportId, fileUrl }` | Report generation completed |

---

## Request and Response Flow

```js
1. Global Middleware
   ├── Helmet             security response headers
   ├── Compression        gzip all responses
   ├── Pino HTTP          structured request/response logging
   └── Request ID         stamp X-Request-ID header on every request

2. ThrottlerGuard
   └── 100 requests per 60 seconds per IP
       → 429 Too Many Requests if exceeded

3. JwtAuthGuard
   ├── Extract Bearer token from Authorization header
   ├── Verify signature and expiry using JWT strategy
   ├── Attach decoded user to req.user
   └── → 401 Unauthorized if token is missing, expired, or invalid

4. RolesGuard
   ├── Read @Roles() decorator from controller method
   ├── Compare req.user.role against required roles
   └── → 403 Forbidden if role is not permitted

5. ValidationPipe
   ├── Deserialize request body into DTO class
   ├── Run class-validator decorators against all fields
   ├── Strip any properties not declared in the DTO (whitelist: true)
   └── → 400 Bad Request with field-level errors if validation fails

6. Controller
   └── Receive validated, authorized, typed request
       Delegate immediately to service — no logic here

7. Service
   ├── Apply all business rules
   ├── Call repository for data operations
   ├── Emit domain events via EventEmitter2
   └── Return result to controller

8. Repository
   └── Execute all Prisma queries
       Service never writes Prisma calls directly

9. ResponseInterceptor
   └── Wrap every 2xx response: { success: true, data: ... }

10. GlobalExceptionFilter
    ├── Catch all unhandled exceptions
    ├── Map to consistent error envelope: { success: false, error: { ... } }
    └── Log full stack trace via Pino
```

---

## Validation and Security

### DTO Validation

Every request body is a typed class with `class-validator` decorators:

```typescript
// src/shipments/dto/create-shipment.dto.ts
import { IsString, IsUUID, IsOptional, IsNumber, Min, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShipmentDto {
  @ApiProperty({ example: 'Alexandria' })
  @IsString()
  @MaxLength(100)
  shipment_origin_city: string;

  @ApiProperty({ example: 'Cairo' })
  @IsString()
  @MaxLength(100)
  shipment_destination_city: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  route_id?: string;

  @ApiProperty({ required: false, example: 1250.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  shipment_weight_kg?: number;
}
```

### Security Layers

| Layer | Tool | What it protects against |
|---|---|---|
| Password hashing | bcrypt — 12 rounds | Brute force, leaked database, rainbow tables |
| Access tokens | JWT — 15 minute expiry | Session hijacking |
| Refresh tokens | Hashed in DB, rotated on use | Token theft and replay |
| Rate limiting | @nestjs/throttler | Brute force, API abuse, DDoS |
| HTTP headers | Helmet | XSS, clickjacking, MIME sniffing |
| Input validation | class-validator + whitelist | Injection attacks, mass assignment |
| Role enforcement | RolesGuard on every route | Privilege escalation |
| CORS | Restricted to CLIENT_URL | Cross-origin request forgery |

---

## Module Responsibilities

| Module | Owns | Depends On |
|---|---|---|
| `AuthModule` | Login, register, token rotation | `UsersModule`, `PrismaModule` |
| `UsersModule` | User CRUD, organization context | `PrismaModule` |
| `OrganizationsModule` | Organization CRUD, member directory | `PrismaModule` |
| `ShipmentsModule` | Shipment lifecycle, state machine, GPS | `PrismaModule` |
| `AdminModule` | Platform management, cross-org operations | `PrismaModule` |
| `MailModule` | SMTP, email templates | Config |
| `QueueModule` | BullMQ consumers, job processing | `RedisModule`, `MailModule` |
| `RedisModule` | Redis client, cache operations | Config |
| `PrismaModule` | Database client — global | — |
| `ConfigModule` | Environment variables — global | — |

---

## Development Workflow

### Building a New Module — Step by Step

Every module in this project follows the same pattern. Use the shipments module as your reference.

```
1.  Create the module folder under src/feature-name/
2.  Create feature.module.ts
3.  Create controllers/feature.controller.ts
4.  Create services/feature.service.ts
5.  Create repositories/feature.repository.ts  (if DB access needed)
6.  Create dto/create-feature.dto.ts
7.  Register the module in app.module.ts imports array
8.  Add Swagger decorators to controller methods
9.  Test all endpoints in Postman
10. Write unit tests for the service
```

### Git Workflow

```bash
# Never commit directly to main
git checkout -b feat/module-name

git add .
git commit -m "feat(module): description of what was added"
git push origin feat/module-name

# Open a pull request for review before merging
```

**Commit message format:**

```
feat(scope):     new feature or endpoint
fix(scope):      bug fix
refactor(scope): internal change, no behavior change
docs:            documentation update
chore:           dependencies, config, build scripts
```

---

## Testing

```bash
# Run all unit tests
npm run test

# Watch mode — reruns on file change
npm run test:watch

# End-to-end tests
npm run test:e2e

# Coverage report
npm run test:cov
```

Unit test files live next to the file they test:

```
users.service.ts
users.service.spec.ts
```

End-to-end tests live in `test/` and test complete HTTP flows from request to database.

---
## License
**PROPRIETARY LICENSE**
© 2026 Egypt Supply Chain Visibility Team. All Rights Reserved.

This project is a university capstone project developed to demonstrate full-stack engineering skills applied to a real national infrastructure problem.

This software and associated documentation are proprietary and confidential. No part of this project may be reproduced, distributed, or transmitted in any form without prior written permission from the authors.

---

<div align="center">
  <strong>Bringing visibility to Egypt's supply chains.</strong>
</div>