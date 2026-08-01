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
  - [Pagination](#pagination)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Organizations Endpoints](#organizations-endpoints)
  - [Users Endpoints](#users-endpoints)
  - [Shipments Endpoints](#shipments-endpoints)
  - [Checkpoints Endpoints](#checkpoints-endpoints)
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

Every business feature is isolated in its own NestJS module. Modules communicate through NestJS's built-in event system. No external message broker is required at this scale.

**What is live today:**
- JWT authentication with access and refresh token rotation
- Session management — list active sessions, revoke one or all
- Role-based access control across Admin, Shipper, Carrier, and Regulator roles
- Organization management with member directory and invitation system
- User management with organization context
- Full shipment lifecycle with state machine enforcement
- Continuous GPS location updates via self-transition support
- Checkpoint management with paginated listing
- Invitation system with async email delivery via BullMQ
- Redis integration for caching and queue backend
- Admin module with invitation and audit log management
- Production-grade server-side pagination across all list endpoints

---
## Architecture
```bash
Client (React)
      |
      v
NestJS API — Modular Monolith
      |
      |-- REST Controllers -> Guards -> Pipes -> Services -> Repositories -> Prisma -> PostgreSQL
      |
      |-- WebSocket Gateway -> Socket.IO -> Shipment Rooms
      |
      `-- BullMQ Workers -> Redis -> Invitation Emails -> Mail Module -> SMTP
```

**Request pipeline — every inbound HTTP request passes through these layers in order:**
```bash
Inbound HTTP Request
        |
        v
Global Middleware        helmet · compression · pino logger · request-id stamp
        |
        v
ThrottlerGuard           100 requests / 60 seconds per IP — 429 if exceeded
        |
        v
JwtAuthGuard             verify Bearer token · attach req.user · 401 if invalid
        |
        v
RolesGuard               check @Roles() decorator against req.user.role · 403 if denied
        |
        v
ValidationPipe           validate DTO · strip unknown fields · 400 if invalid
        |
        v
Controller               route handler — zero business logic
        |
        v
Service                  all business logic · emit domain events
        |
        v
Repository               all Prisma queries · service never writes raw queries
        |
        v
PostgreSQL
```

---
## Prerequisites
Install the following before starting. Every team member must have the same versions to avoid environment differences.
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
```bash
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
## Environment Setup
### Step 1 — Copy the environment template
```bash
cp .env.example .env
```

### Step 2 — Fill in your `.env`
```bash
# Application
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:5173

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/escv_db"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-64-byte-random-access-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-64-byte-random-refresh-secret"
JWT_REFRESH_EXPIRES_IN="7d"

# Mail (SMTP)
MAIL_HOST="smtp.your-provider.com"
MAIL_PORT=587
MAIL_USER="your-email@domain.com"
MAIL_PASS="your-smtp-password"
MAIL_FROM="noreply@escv.eg"
```

`.env` is in `.gitignore`. Never commit it. Only `.env.example` with empty values goes to the repository.

Generate secure secrets:

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
mkdir -p checkpoints/controllers checkpoints/services checkpoints/repositories checkpoints/dto
mkdir -p admin/controllers admin/services
mkdir -p mail queue redis prisma
mkdir -p common/decorators config types
```

---
## Prisma Setup
Prisma reads `schema.prisma` and generates a fully-typed TypeScript client. Every database query in the application goes through this client. No raw SQL appears in service or controller files.

### Initialize Prisma
```bash
npx prisma init
```

**Prisma 6+ note:** If you see an error about `url` in `schema.prisma`, the connection string must move to `prisma.config.ts`. Install the adapter:

```bash
npm install @prisma/adapter-pg pg
npm install -D @types/pg
```

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
| `@@map("table_name")` | Maps Prisma model to the exact database table name |

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

Add to `package.json`:

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
```bash
GET http://localhost:3000/api/health   ->  200 OK
GET http://localhost:3000/api/docs     ->  Swagger UI
```

---
## Implemented Modules
This section documents every module that has been built and merged into the repository. Each module maps to a business domain and owns its own controller, service, repository, and DTOs.

---
### Auth Module
**Location:** `src/auth/`
Handles the complete authentication lifecycle from registration through session management.

**Endpoints implemented:**
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Create account, hash password with bcrypt, return token pair |
| `POST` | `/auth/login` | Validate credentials, issue access token (15m) and refresh token (7d) |
| `POST` | `/auth/refresh` | Validate refresh token, rotate it, issue new token pair |
| `POST` | `/auth/logout` | Invalidate the current refresh token |
| `GET` | `/auth/me` | Return authenticated user profile with organization context |
| `GET` | `/auth/sessions` | List all active sessions for the current user with pagination |
| `DELETE` | `/auth/sessions/:id` | Revoke a specific session by refresh token ID |
| `DELETE` | `/auth/sessions` | Revoke all sessions except the current one |

**How token security works:**
Access tokens expire in 15 minutes. Refresh tokens are stored as bcrypt hashes in the `refresh_token` table — the raw token is never persisted. On every refresh request, the token is rotated: the old one is deleted and a new one is issued. If a stolen token is replayed after it has already been rotated, the hash comparison fails and the request is rejected immediately.

**Session management:**
The sessions endpoints give users visibility into their active devices and the ability to revoke access remotely. `DELETE /auth/sessions` is the "log out of all devices" endpoint — it deletes every refresh token except the one used to make the request, so the current session remains valid.

---
### Users Module
**Location:** `src/users/`
Manages user records and provides the user lookup functions that other modules depend on.

**What is implemented:**
- User lookup by ID and by email
- Organization details embedded in user response objects — the frontend does not need a separate request after login
- User role retrieval consumed by the RolesGuard

---
### Organizations Module
**Location:** `src/organizations/`

Manages organization records, the member directory, and the invitation system.

**Endpoints implemented:**
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/organizations` | List all organizations (Admin, Regulator) |
| `GET` | `/organizations/:id` | Organization detail |
| `POST` | `/organizations` | Create organization (Admin) |
| `PATCH` | `/organizations/:id` | Update organization (Admin) |
| `PATCH` | `/organizations/:id/deactivate` | Soft deactivate (Admin) |
| `GET` | `/organizations/:id/members` | Paginated member directory |
| `GET` | `/organizations/:id/invitations` | Paginated pending invitations |

Both `/members` and `/invitations` support full pagination with `page` and `limit` query parameters.

---
### Shipments Module
**Location:** `src/shipments/`
Manages the complete shipment lifecycle with a state machine that enforces which status transitions are valid. Supports continuous GPS coordinate updates through self-transitions.

**Endpoints implemented:**
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/shipments` | Paginated list — role-filtered automatically |
| `GET` | `/shipments/:id` | Shipment detail |
| `POST` | `/shipments` | Create shipment (Shipper, Admin) |
| `PATCH` | `/shipments/:id` | Update metadata (Shipper, Admin) |
| `PATCH` | `/shipments/:id/status` | Transition status (Carrier, Admin) |
| `PATCH` | `/shipments/:id/location` | Push GPS coordinates — self-transition |
| `PATCH` | `/shipments/:id/assign-carrier` | Assign carrier organization (Admin) |
| `DELETE` | `/shipments/:id` | Cancel shipment (Admin) |
| `GET` | `/shipments/:id/events` | Full append-only event timeline |
| `GET` | `/shipments/:id/alerts` | Alerts linked to this shipment |

**Role-based data filtering — enforced in the service, not the controller:**

- Shipper sees only shipments where `shipper_organization_id` matches their organization
- Carrier sees only shipments where `carrier_organization_id` matches their organization
- Regulator and Admin see all shipments

**Valid state machine transitions:**
```bash
draft             -> confirmed
confirmed         -> picked_up
picked_up         -> in_transit
in_transit        -> in_transit        (self-transition — GPS location update)
in_transit        -> at_checkpoint
in_transit        -> customs_hold
in_transit        -> delayed
at_checkpoint     -> in_transit
at_checkpoint     -> customs_hold
customs_hold      -> customs_cleared
customs_cleared   -> in_transit
in_transit        -> out_for_delivery
out_for_delivery  -> delivered
any status        -> cancelled
```

Any transition not listed above is rejected with a 422 Unprocessable Entity response. Self-transitions are explicitly allowed so a carrier can push GPS coordinates continuously while a shipment remains `in_transit` without triggering the transition guard.

---
### Admin Module
**Location:** `src/admin/`

Platform-wide management endpoints accessible only to the Admin role.

**Endpoints implemented:**
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/stats` | Platform-wide KPI statistics |
| `GET` | `/admin/users` | All users across all organizations |
| `PUT` | `/admin/users/:id/role` | Change a user's role |
| `DELETE` | `/admin/users/:id` | Remove a user from the platform |
| `GET` | `/admin/organizations` | All organizations |
| `GET` | `/admin/invitations` | Paginated list of all platform invitations |
| `GET` | `/admin/audit-logs` | Paginated platform audit log |

Both `/admin/invitations` and `/admin/audit-logs` support full pagination. The admin pagination default is `limit=20` rather than the standard `limit=10` used elsewhere, reflecting the expectation that admin views display more data per page.

---
### Mail Module
**Location:** `src/mail/`
Handles all outbound email through SMTP. Used by the Queue module to send invitation emails without blocking the request cycle.

**What is implemented:**
- SMTP connection configured through environment variables
- `MailService` injectable across any module that needs to send email
- Invitation email template

---
### Queue Module
**Location:** `src/queue/`
BullMQ-powered async job queue backed by Redis. When an invitation is created, a job is added to the queue and the API responds immediately. The consumer processes the job and calls the Mail service without the user waiting.

**What is implemented:**
- BullMQ queue configuration and module setup
- Invitation email consumer — dequeues jobs and calls `MailService`
- Queue registered in `AppModule`

---
### Redis Module
**Location:** `src/redis/`
Global Redis client using `ioredis`. Provides a `RedisService` injectable anywhere in the application. Used as the BullMQ queue backend and available for caching.

**What is implemented:**
- `ioredis` client setup
- `RedisService` with `get`, `set`, `del`, and `expire` methods
- Declared as a global module — no need to re-import in feature modules

---
### Prisma Module
**Location:** `src/prisma/`
The single database client for the entire application. `PrismaService` extends `PrismaClient` and handles the connection lifecycle correctly within NestJS.

**What is implemented:**
- `PrismaService` with `onModuleInit` (connect) and `onModuleDestroy` (disconnect)
- Declared as `@Global()` — imported once in `AppModule`, available everywhere
- Compatible with Prisma 6+ adapter configuration

---
## API Design
### Design Principles
Every endpoint in the ESCV API follows these rules without exception.

**Versioned base path** — all routes live under `/api`. When breaking changes are needed, a versioned prefix such as `/api/v2` is introduced without removing the existing routes.

**Plural nouns, never verbs:**
```bash
Correct:    GET /api/shipments
Incorrect:  GET /api/getShipments
```

**Nested routes express ownership:**
```bash
GET  /api/shipments/:id/events
POST /api/shipments/:id/events
GET  /api/organizations/:id/members
GET  /api/organizations/:id/invitations
```

**HTTP verbs carry their standard meaning:**
```bash
GET     Read. Never mutates state.
POST    Create a new resource.
PATCH   Update specific fields of an existing resource.
PUT     Replace a resource entirely.
DELETE  Remove or deactivate.
```

**Consistent response envelope** — every response, success or error, follows this shape:
```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 150,
    "totalPages": 15,
    "hasNextPage": true,
    "hasPreviousPage": false
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

---
### Base URL and Versioning
```bash
Development:   http://localhost:3000/api
Swagger UI:    http://localhost:3000/api/docs
```

---
### Pagination
All list endpoints implement server-side pagination using a consistent pattern. Pagination parameters are optional — defaults are applied when omitted so existing clients require no changes.

**Query parameters:**
| Parameter | Type | Default | Constraints | Description |
|---|---|---|---|---|
| `page` | integer | 1 | min: 1 | Page number |
| `limit` | integer | 10 (admin: 20) | min: 1, max: 100 | Records per page |

**Implementation pattern used across all modules:**

```typescript
// Parallel count and data query — avoids sequential round trips
const [data, totalItems] = await Promise.all([
  this.prisma.shipment.findMany({
    skip: (page - 1) * limit,
    take: limit,
    where,
    orderBy: { shipment_created_at: 'desc' },
  }),
  this.prisma.shipment.count({ where }),
])

return {
  data,
  meta: {
    page,
    limit,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
    hasNextPage: page < Math.ceil(totalItems / limit),
    hasPreviousPage: page > 1,
  },
}
```

**Validation — returns 400 Bad Request for invalid values:**
```js
GET /api/shipments?page=0         -> 400 (page must be >= 1)
GET /api/shipments?limit=200      -> 400 (limit must be <= 100)
GET /api/shipments?page=abc       -> 400 (page must be an integer)
```

**Endpoints with pagination:**
| Endpoint | Default limit |
|---|---|
| `GET /shipments` | 10 |
| `GET /checkpoints` | 10 |
| `GET /organizations/:id/members` | 10 |
| `GET /organizations/:id/invitations` | 10 |
| `GET /auth/sessions` | 10 |
| `GET /admin/invitations` | 20 |
| `GET /admin/audit-logs` | 20 |

---
### Authentication Endpoints
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/auth/register` | No | — | Register new user account |
| `POST` | `/auth/login` | No | — | Login and receive token pair |
| `POST` | `/auth/refresh` | No | — | Rotate refresh token and receive new pair |
| `POST` | `/auth/logout` | Yes | Any | Invalidate current refresh token |
| `GET` | `/auth/me` | Yes | Any | Fetch current user profile with organization |
| `PUT` | `/auth/me/password` | Yes | Any | Change own password |
| `GET` | `/auth/sessions` | Yes | Any | List active sessions with pagination |
| `DELETE` | `/auth/sessions/:id` | Yes | Any | Revoke a specific session |
| `DELETE` | `/auth/sessions` | Yes | Any | Revoke all sessions except current |

**Register request body:**
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

**Sessions list response:**
```json
{
  "data": [
    {
      "refresh_token_id": "uuid",
      "token_ip_address": "197.32.10.4",
      "token_created_at": "2026-07-20T09:00:00Z",
      "token_expires_at": "2026-07-27T09:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 3,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

---
### Organizations Endpoints
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/organizations` | Yes | Admin, Regulator | List all organizations |
| `GET` | `/organizations/:id` | Yes | Admin, Regulator | Organization detail |
| `POST` | `/organizations` | Yes | Admin | Create organization |
| `PATCH` | `/organizations/:id` | Yes | Admin | Update organization |
| `PATCH` | `/organizations/:id/deactivate` | Yes | Admin | Deactivate organization |
| `GET` | `/organizations/:id/members` | Yes | Admin | Paginated member directory |
| `GET` | `/organizations/:id/invitations` | Yes | Admin | Paginated pending invitations |

---
### Users Endpoints
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/users` | Yes | Admin | List all users |
| `GET` | `/users/:id` | Yes | Admin | User detail |
| `POST` | `/users` | Yes | Admin | Create user |
| `PATCH` | `/users/:id` | Yes | Admin | Update user |
| `PATCH` | `/users/:id/deactivate` | Yes | Admin | Deactivate user |

---
### Shipments Endpoints
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/shipments` | Yes | All | Paginated list — role-filtered automatically |
| `GET` | `/shipments/:id` | Yes | All | Shipment detail |
| `POST` | `/shipments` | Yes | Shipper, Admin | Create shipment |
| `PATCH` | `/shipments/:id` | Yes | Shipper, Admin | Update metadata |
| `PATCH` | `/shipments/:id/status` | Yes | Carrier, Admin | Transition shipment status |
| `PATCH` | `/shipments/:id/location` | Yes | Carrier | Push GPS coordinates |
| `PATCH` | `/shipments/:id/assign-carrier` | Yes | Admin | Assign carrier organization |
| `DELETE` | `/shipments/:id` | Yes | Admin | Cancel shipment |
| `GET` | `/shipments/:id/events` | Yes | All | Full append-only event timeline |
| `GET` | `/shipments/:id/alerts` | Yes | All | Alerts linked to this shipment |

**Query parameters:**
```js
GET /api/shipments?page=1&limit=20&status=in_transit&origin_city=Alexandria
```

**Status update request body:**
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
### Checkpoints Endpoints
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/checkpoints` | Yes | All | Paginated list of all checkpoints |
| `GET` | `/checkpoints/:id` | Yes | All | Checkpoint detail with coordinates |
| `POST` | `/checkpoints` | Yes | Admin | Create checkpoint |
| `PATCH` | `/checkpoints/:id` | Yes | Admin | Update checkpoint |
| `PATCH` | `/checkpoints/:id/deactivate` | Yes | Admin | Deactivate checkpoint |

---
### Admin Endpoints
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/admin/stats` | Yes | Admin | Platform-wide KPI statistics |
| `GET` | `/admin/users` | Yes | Admin | All users across all organizations |
| `PUT` | `/admin/users/:id/role` | Yes | Admin | Change user role |
| `DELETE` | `/admin/users/:id` | Yes | Admin | Remove user from platform |
| `GET` | `/admin/organizations` | Yes | Admin | All organizations |
| `GET` | `/admin/invitations` | Yes | Admin | Paginated all platform invitations |
| `GET` | `/admin/audit-logs` | Yes | Admin | Paginated platform audit log |

---
### Alerts Endpoints
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/alerts` | Yes | All | Alerts for the current user |
| `GET` | `/alerts/unread-count` | Yes | All | Count of unread alerts |
| `GET` | `/alerts/:id` | Yes | All | Alert detail |
| `PATCH` | `/alerts/:id/read` | Yes | All | Mark alert as read |
| `PATCH` | `/alerts/:id/resolve` | Yes | Admin, Regulator | Mark alert as resolved |

---
### Dashboard Endpoints
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/dashboard/stats` | Yes | All | KPI statistics — role-filtered |
| `GET` | `/dashboard/shipments/map` | Yes | All | Active shipments with coordinates |
| `GET` | `/dashboard/ports/load` | Yes | Regulator, Admin | Shipment count per checkpoint |
| `GET` | `/dashboard/carrier/performance` | Yes | Admin, Regulator | Carrier delivery performance |

---
### Reports Endpoints
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/reports` | Yes | Admin, Regulator | Request async report generation |
| `GET` | `/reports` | Yes | Admin, Regulator | List all reports |
| `GET` | `/reports/:id` | Yes | Admin, Regulator | Report status and download link |

Report generation is asynchronous. The API returns `report_status: "pending"` immediately. A BullMQ worker processes the job in the background. When generation completes, the client receives a `report:ready` WebSocket event.

---
### Audit Endpoints
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/audit` | Yes | Admin | Browse audit log |
| `GET` | `/audit?resource_type=shipment&resource_id=uuid` | Yes | Admin | Audit trail for a specific resource |
| `GET` | `/audit?user_id=uuid` | Yes | Admin | Audit trail for a specific user |

Audit logs are read-only. There are no write, update, or delete endpoints.

---
### Health Endpoints
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | No | Overall application health |
| `GET` | `/health/db` | No | Database connectivity |
| `GET` | `/health/redis` | No | Redis connectivity |

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

---
### WebSocket Events
Connect to `ws://localhost:3000` with a valid JWT Bearer token in the handshake authorization header.

**Client to server:**
| Event | Payload | Description |
|---|---|---|
| `join:shipment` | `{ shipmentId: string }` | Subscribe to updates for a specific shipment |
| `leave:shipment` | `{ shipmentId: string }` | Unsubscribe from a shipment room |
| `join:dashboard` | `{ role: string }` | Subscribe to the role-based dashboard feed |

**Server to client:**
| Event | Payload | Description |
|---|---|---|
| `shipment:updated` | `{ shipmentId, status, coordinates, timestamp }` | Status or location changed |
| `alert:new` | `{ alertId, type, severity, message, shipmentId }` | New alert for this user |
| `dashboard:stats` | `{ activeShipments, delayed, portLoad }` | Periodic KPI broadcast |
| `report:ready` | `{ reportId, fileUrl }` | Report generation completed |

---
## Request and Response Flow
Every inbound HTTP request passes through this pipeline in order:
```js
1. Global Middleware
   |-- Helmet             HTTP security headers
   |-- Compression        gzip all responses
   |-- Pino HTTP          structured request and response logging
   `-- Request ID         stamp X-Request-ID on every request

2. ThrottlerGuard
   `-- 100 requests per 60 seconds per IP
       Returns 429 Too Many Requests if exceeded

3. JwtAuthGuard
   |-- Extract Bearer token from Authorization header
   |-- Verify signature and expiry using JWT strategy
   |-- Attach decoded payload to req.user
   `-- Returns 401 Unauthorized if token is missing, expired, or invalid

4. RolesGuard
   |-- Read @Roles() decorator from the controller method
   |-- Compare req.user.role against the required roles list
   `-- Returns 403 Forbidden if the role is not permitted

5. ValidationPipe
   |-- Deserialize request body into the DTO class
   |-- Run class-validator decorators against all fields
   |-- Strip any property not declared in the DTO (whitelist: true)
   `-- Returns 400 Bad Request with field-level errors if validation fails

6. Controller
   `-- Receives a validated, authorized, typed request
       Delegates immediately to the service — no business logic here

7. Service
   |-- Applies all business rules
   |-- Calls the repository for data access
   |-- Emits domain events via EventEmitter2
   `-- Returns the result to the controller

8. Repository
   `-- Executes all Prisma queries
       The service never writes Prisma calls directly

9. ResponseInterceptor
   `-- Wraps every 2xx response: { success: true, data: ... }

10. GlobalExceptionFilter
    |-- Catches all unhandled exceptions
    |-- Maps to consistent error envelope: { success: false, error: { ... } }
    `-- Logs full stack trace via Pino
```

---
## Validation and Security
### DTO Validation

Every request body is a typed class with `class-validator` decorators. The `ValidationPipe` runs against every incoming request and strips any property not declared in the DTO.

```typescript
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

### Pagination Validation
Pagination parameters are validated with `ParseIntPipe` and `DefaultValuePipe` before reaching the service:

```typescript
@Get()
findAll(
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
) {
  return this.service.findAll({ page, limit })
}
```

### Security Layers
| Layer | Tool | What it protects against |
|---|---|---|
| Password hashing | bcrypt — 12 rounds | Brute force, leaked database, rainbow tables |
| Access tokens | JWT — 15 minute expiry | Session hijacking |
| Refresh tokens | Hashed in DB, rotated on every use | Token theft and replay attacks |
| Session management | Revoke by ID or revoke all | Unauthorized active sessions |
| Rate limiting | @nestjs/throttler — 100 req/60s | Brute force, API abuse, DDoS |
| HTTP headers | Helmet | XSS, clickjacking, MIME sniffing |
| Input validation | class-validator + whitelist: true | Injection attacks, mass assignment |
| Role enforcement | RolesGuard on every protected route | Privilege escalation |
| CORS | Restricted to CLIENT_URL env var | Cross-origin request forgery |

---
## Module Responsibilities
| Module | Owns | Depends On |
|---|---|---|
| `AuthModule` | Login, register, token rotation, session management | `UsersModule`, `PrismaModule` |
| `UsersModule` | User CRUD, organization context | `PrismaModule` |
| `OrganizationsModule` | Organization CRUD, members, invitations | `PrismaModule` |
| `ShipmentsModule` | Shipment lifecycle, state machine, GPS | `PrismaModule` |
| `CheckpointsModule` | Checkpoint CRUD, paginated listing | `PrismaModule` |
| `AdminModule` | Platform management, invitations, audit logs | `PrismaModule` |
| `MailModule` | SMTP, email templates | Config |
| `QueueModule` | BullMQ consumers, job processing | `RedisModule`, `MailModule` |
| `RedisModule` | Redis client, cache operations | Config |
| `PrismaModule` | Database client — global | — |
| `ConfigModule` | Environment variables — global | — |

---
## Development Workflow
### Building a New Module
Every module follows this pattern. Use the shipments module as your reference.

```bash
1.  Create the module folder under src/feature-name/
2.  Create feature.module.ts
3.  Create controllers/feature.controller.ts
4.  Create services/feature.service.ts
5.  Create repositories/feature.repository.ts (if database access is needed)
6.  Create dto/create-feature.dto.ts
7.  Register the module in app.module.ts imports array
8.  Add Swagger decorators to all controller methods
9.  Add pagination if the endpoint returns a list
10. Test all endpoints in Postman
11. Write unit tests for the service
12. Update this README
```

### Git Workflow
```bash
# Never commit directly to main
git checkout -b feat/module-name

git add .
git commit -m "feat(module): description of what was added"
git push origin feat/module-name

# Open a pull request — review before merging
```
**Commit message format:**

```js
feat(scope):      new feature or endpoint
fix(scope):       bug fix
refactor(scope):  internal change, no behavior change
docs:             documentation update
chore:            dependencies, config, build scripts
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
```js
users.service.ts
users.service.spec.ts
```

End-to-end tests live in `test/` and test complete HTTP request-to-database flows.

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