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
  - [Schema Translation](#schema-translation)
  - [All 12 Models](#all-12-models)
  - [Running Migrations](#running-migrations)
  - [Seeding the Database](#seeding-the-database)
- [Running the Server](#running-the-server)
- [API Design](#api-design)
  - [Design Principles](#design-principles)
  - [Base URL & Versioning](#base-url--versioning)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Organizations Endpoints](#organizations-endpoints)
  - [Users Endpoints](#users-endpoints)
  - [Shipments Endpoints](#shipments-endpoints)
  - [Tracking Endpoints](#tracking-endpoints)
  - [Alerts Endpoints](#alerts-endpoints)
  - [Dashboard Endpoints](#dashboard-endpoints)
  - [Reports Endpoints](#reports-endpoints)
  - [Audit Endpoints](#audit-endpoints)
  - [Health Endpoints](#health-endpoints)
  - [WebSocket Events](#websocket-events)
- [Request & Response Flow](#request--response-flow)
- [Validation & Security](#validation--security)
- [Module Responsibilities](#module-responsibilities)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [License](#license)

---
## Overview
The ESCV server is a production-grade **NestJS modular monolith** that powers the national supply chain visibility platform. It exposes a versioned REST API, a real-time WebSocket gateway, and an async job queue for alert processing and report generation.

Every business feature is isolated in its own NestJS module. Modules communicate through NestJS's built-in `EventEmitter2` — no message broker required at this scale.

**Key capabilities:**
- JWT authentication with refresh token rotation
- Role-based access control (Admin / Shipper / Carrier / Regulator)
- Append-only shipment event timeline
- Real-time WebSocket updates per shipment room
- Async alert pipeline via BullMQ + Redis
- Auto-generated Swagger API documentation
- Structured JSON logging via Pino
- Full audit trail on every significant action

---
## Architecture

```typescript
Client (React)
      │
      ▼
  NestJS API (Modular Monolith)
      │
      ├── REST Controllers  → Guards → Pipes → Services → Repositories → Prisma → PostgreSQL
      │
      ├── WebSocket Gateway → Socket.IO → Shipment Rooms
      │
      └── BullMQ Workers   → Redis Queue → Alert Processing → Notifications
```

**Architectural pattern:** Layered Feature-Based Architecture
```typescript
HTTP Request
    │
    ▼
Global Middleware (Helmet, Compression, Logger)
    │
    ▼
ThrottlerGuard (Rate limiting)
    │
    ▼
JwtAuthGuard (Token validation)
    │
    ▼
RolesGuard (Role authorization)
    │
    ▼
ValidationPipe (DTO validation)
    │
    ▼
Controller (Route handler)
    │
    ▼
Service (Business logic)
    │
    ▼
Repository (Database queries via Prisma)
    │
    ▼
PostgreSQL
```

---
## Prerequisites
Before starting, ensure the following are installed on your machine.

| Tool | Version | Purpose | Install |
|---|---|---|---|
| **Node.js** | 20.x LTS | JavaScript runtime | [nodejs.org](https://nodejs.org) |
| **npm** | 10.x | Package manager | Included with Node |
| **NestJS CLI** | Latest | Project scaffolding | `npm i -g @nestjs/cli` |
| **PostgreSQL** | 16.x | Primary database | [postgresql.org](https://www.postgresql.org) |
| **Redis** | 7.x | Queue + cache backend | [redis.io](https://redis.io) |
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
| ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white) | ORM + Migrations | 5.x |
| ![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white) | Cache + Queue Backend | 7.x |
| ![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white) | Message Broker | 3.x |
| ![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white) | Real-time WebSocket | 4.x |
| ![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white) | Authentication | 9.x |
| ![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black) | API Documentation | 7.x |
| ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white) | Containerization | Latest |

---
## Project Structure
This is the complete server folder structure. Every folder has a reason.
```typescript
```

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
PORT=
CLIENT_URL=http://localhost:PORT

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:PORT/escv_db"

# Redis
REDIS_URL="redis://localhost:PORT"

# JWT
JWT_SECRET="your-64-byte-random-access-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-64-byte-random-refresh-secret"
JWT_REFRESH_EXPIRES_IN="7d"
```

> **Rule:** `.env` is in `.gitignore`. Never commit it. Only `.env.example` with empty values goes to GitHub.

> In the `.env.example` generate secrets with: 
```typescript
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---
## Installation
### Step 1 — Scaffold the NestJS project
```bash
npm install -g @nestjs/cli
nest new server
cd server
```
When prompted for a package manager, choose **npm**.

### Step 2 — Install all dependencies
```bash
# Configuration & environment validation
npm install @nestjs/config joi

# Validation
npm install class-validator class-transformer

# Authentication
npm install @nestjs/passport @nestjs/jwt passport passport-jwt bcrypt
npm install -D @types/bcrypt @types/passport-jwt

# Database
npm install @prisma/client
npm install -D prisma

# Redis + Queue
npm install ioredis @nestjs/bullmq bullmq

# WebSockets
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io

# Swagger documentation
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

---
## Prisma Setup
Prisma is the ORM. It reads `schema.prisma` and generates a fully-typed TypeScript client. Every database query in the application goes through this client.

### Initialize Prisma
```bash
npx prisma init
```

This creates `prisma/schema.prisma` and adds `DATABASE_URL` to your `.env`.

### Configure the datasource
Open `prisma/schema.prisma` and set the top section:
```typescript
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---
### Schema Translation
Every table in `schema.sql` becomes a Prisma `model`. The rules are:
| SQL concept | Prisma equivalent |
|---|---|
| `CREATE TABLE user` | `model User` |
| `UUID PRIMARY KEY` | `@id @default(dbgenerated("gen_random_uuid()")) @db.Uuid` |
| `VARCHAR(255) NOT NULL` | `String @db.VarChar(255)` |
| `TEXT` | `String` |
| `BOOLEAN NOT NULL DEFAULT true` | `Boolean @default(true)` |
| `TIMESTAMPTZ NOT NULL DEFAULT NOW()` | `DateTime @default(now()) @db.Timestamptz()` |
| `TIMESTAMPTZ` (nullable) | `DateTime? @db.Timestamptz()` |
| `NUMERIC(10, 2)` | `Decimal? @db.Decimal(10, 2)` |
| `INTEGER` | `Int` |
| `JSONB` | `Json?` |
| `INET` | `String?` (no native Prisma INET type) |
| `REFERENCES table(col)` | `@relation(fields: [...], references: [...])` |
| `@@map("table_name")` | Maps Prisma model to actual DB table name |

---
### All 12 Models
Copy this complete schema into `prisma/schema.prisma`:
```typescript
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Organization
model Organization {
  organization_id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organization_name        String   @db.VarChar(255)
  organization_type        String   @db.VarChar(50)
  organization_email       String   @unique @db.VarChar(255)
  organization_phone       String?  @db.VarChar(30)
  organization_address     String?
  organization_country     String   @default("Egypt") @db.VarChar(100)
  organization_is_active   Boolean  @default(true)
  organization_created_at  DateTime @default(now()) @db.Timestamptz()
  organization_updated_at  DateTime @updatedAt @db.Timestamptz()

  users             User[]
  shipper_shipments Shipment[] @relation("ShipperOrganization")
  carrier_shipments Shipment[] @relation("CarrierOrganization")

  @@map("organization")
}

// User
model User {
  user_id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organization_id    String    @db.Uuid
  user_email         String    @unique @db.VarChar(255)
  user_password_hash String    @db.VarChar(255)
  user_first_name    String    @db.VarChar(100)
  user_last_name     String    @db.VarChar(100)
  user_role          String    @db.VarChar(50)
  user_phone         String?   @db.VarChar(30)
  user_is_active     Boolean   @default(true)
  user_last_login_at DateTime? @db.Timestamptz()
  user_created_at    DateTime  @default(now()) @db.Timestamptz()
  user_updated_at    DateTime  @updatedAt @db.Timestamptz()

  organization    Organization    @relation(fields: [organization_id], references: [organization_id])
  refresh_tokens  RefreshToken[]
  created_shipments Shipment[]   @relation("CreatedByUser")
  recorded_events ShipmentEvent[]
  user_alerts     UserAlert[]
  audit_logs      AuditLog[]
  reports         Report[]

  @@map("user")
}

// RefreshToken
model RefreshToken {
  refresh_token_id String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id          String   @db.Uuid
  token_hash       String   @unique @db.VarChar(255)
  token_expires_at DateTime @db.Timestamptz()
  token_ip_address String?  @db.VarChar(50)
  token_created_at DateTime @default(now()) @db.Timestamptz()

  user User @relation(fields: [user_id], references: [user_id], onDelete: Cascade)

  @@map("refresh_token")
}

// Checkpoint
model Checkpoint {
  checkpoint_id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  checkpoint_name       String   @db.VarChar(255)
  checkpoint_code       String   @unique @db.VarChar(20)
  checkpoint_type       String   @db.VarChar(50)
  checkpoint_city       String   @db.VarChar(100)
  checkpoint_latitude   Decimal  @db.Decimal(10, 7)
  checkpoint_longitude  Decimal  @db.Decimal(10, 7)
  checkpoint_is_active  Boolean  @default(true)
  checkpoint_created_at DateTime @default(now()) @db.Timestamptz()
  checkpoint_updated_at DateTime @updatedAt @db.Timestamptz()

  route_checkpoints       RouteCheckpoint[]
  current_shipments       Shipment[]
  shipment_events         ShipmentEvent[]

  @@map("checkpoint")
}

// Route
model Route {
  route_id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  route_name             String   @db.VarChar(255)
  route_code             String   @unique @db.VarChar(50)
  route_origin_city      String   @db.VarChar(100)
  route_destination_city String   @db.VarChar(100)
  route_estimated_days   Int?
  route_is_active        Boolean  @default(true)
  route_created_at       DateTime @default(now()) @db.Timestamptz()
  route_updated_at       DateTime @updatedAt @db.Timestamptz()

  route_checkpoints RouteCheckpoint[]
  shipments         Shipment[]

  @@map("route")
}

// RouteCheckpoint
model RouteCheckpoint {
  route_checkpoint_id    String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  route_id               String  @db.Uuid
  checkpoint_id          String  @db.Uuid
  sequence_order         Int
  checkpoint_is_optional Boolean @default(false)

  route      Route      @relation(fields: [route_id], references: [route_id], onDelete: Cascade)
  checkpoint Checkpoint @relation(fields: [checkpoint_id], references: [checkpoint_id])

  @@unique([route_id, sequence_order])
  @@map("route_checkpoint")
}

// Shipment
model Shipment {
  shipment_id                      String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  shipper_organization_id          String    @db.Uuid
  carrier_organization_id          String?   @db.Uuid
  route_id                         String?   @db.Uuid
  created_by_user_id               String    @db.Uuid
  shipment_reference_number        String    @unique @db.VarChar(100)
  shipment_status                  String    @default("draft") @db.VarChar(50)
  shipment_description             String?
  shipment_cargo_type              String?   @db.VarChar(100)
  shipment_weight_kg               Decimal?  @db.Decimal(10, 2)
  shipment_volume_m3               Decimal?  @db.Decimal(10, 3)
  shipment_origin_address          String
  shipment_destination_address     String
  shipment_origin_city             String    @db.VarChar(100)
  shipment_destination_city        String    @db.VarChar(100)
  shipment_estimated_departure_at  DateTime? @db.Timestamptz()
  shipment_estimated_arrival_at    DateTime? @db.Timestamptz()
  shipment_actual_departure_at     DateTime? @db.Timestamptz()
  shipment_actual_arrival_at       DateTime? @db.Timestamptz()
  shipment_current_checkpoint_id   String?   @db.Uuid
  shipment_current_latitude        Decimal?  @db.Decimal(10, 7)
  shipment_current_longitude       Decimal?  @db.Decimal(10, 7)
  shipment_notes                   String?
  shipment_created_at              DateTime  @default(now()) @db.Timestamptz()
  shipment_updated_at              DateTime  @updatedAt @db.Timestamptz()

  shipper_organization   Organization  @relation("ShipperOrganization", fields: [shipper_organization_id], references: [organization_id])
  carrier_organization   Organization? @relation("CarrierOrganization", fields: [carrier_organization_id], references: [organization_id])
  route                  Route?        @relation(fields: [route_id], references: [route_id])
  created_by             User          @relation("CreatedByUser", fields: [created_by_user_id], references: [user_id])
  current_checkpoint     Checkpoint?   @relation(fields: [shipment_current_checkpoint_id], references: [checkpoint_id])
  events                 ShipmentEvent[]
  alerts                 Alert[]

  @@map("shipment")
}

// ShipmentEvent
model ShipmentEvent {
  shipment_event_id    String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  shipment_id          String   @db.Uuid
  checkpoint_id        String?  @db.Uuid
  recorded_by_user_id  String?  @db.Uuid
  event_type           String   @db.VarChar(100)
  event_status         String   @db.VarChar(50)
  event_description    String?
  event_latitude       Decimal? @db.Decimal(10, 7)
  event_longitude      Decimal? @db.Decimal(10, 7)
  event_occurred_at    DateTime @default(now()) @db.Timestamptz()
  event_metadata       Json?

  shipment     Shipment    @relation(fields: [shipment_id], references: [shipment_id])
  checkpoint   Checkpoint? @relation(fields: [checkpoint_id], references: [checkpoint_id])
  recorded_by  User?       @relation(fields: [recorded_by_user_id], references: [user_id])
  alerts       Alert[]

  @@map("shipment_event")
}

// Alert
model Alert {
  alert_id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  shipment_id           String?   @db.Uuid
  triggered_by_event_id String?   @db.Uuid
  alert_type            String    @db.VarChar(100)
  alert_severity        String    @default("info") @db.VarChar(20)
  alert_title           String    @db.VarChar(255)
  alert_message         String
  alert_target_role     String?   @db.VarChar(50)
  alert_is_resolved     Boolean   @default(false)
  alert_resolved_at     DateTime? @db.Timestamptz()
  alert_created_at      DateTime  @default(now()) @db.Timestamptz()
  alert_metadata        Json?

  shipment         Shipment?      @relation(fields: [shipment_id], references: [shipment_id], onDelete: Cascade)
  triggered_by     ShipmentEvent? @relation(fields: [triggered_by_event_id], references: [shipment_event_id])
  user_alerts      UserAlert[]

  @@map("alert")
}

// UserAlert
model UserAlert {
  user_alert_id String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  alert_id      String    @db.Uuid
  user_id       String    @db.Uuid
  is_read       Boolean   @default(false)
  read_at       DateTime? @db.Timestamptz()
  notified_at   DateTime  @default(now()) @db.Timestamptz()

  alert Alert @relation(fields: [alert_id], references: [alert_id], onDelete: Cascade)
  user  User  @relation(fields: [user_id], references: [user_id], onDelete: Cascade)

  @@unique([alert_id, user_id])
  @@map("user_alert")
}

// AuditLog
model AuditLog {
  audit_log_id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id             String?  @db.Uuid
  audit_action        String   @db.VarChar(100)
  audit_resource_type String   @db.VarChar(100)
  audit_resource_id   String?  @db.Uuid
  audit_old_value     Json?
  audit_new_value     Json?
  audit_ip_address    String?  @db.VarChar(50)
  audit_user_agent    String?
  audit_performed_at  DateTime @default(now()) @db.Timestamptz()
  audit_metadata      Json?

  user User? @relation(fields: [user_id], references: [user_id], onDelete: SetNull)

  @@map("audit_log")
}

// Report
model Report {
  report_id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  requested_by_user_id   String?   @db.Uuid
  report_type            String    @db.VarChar(100)
  report_status          String    @default("pending") @db.VarChar(50)
  report_parameters      Json?
  report_file_path       String?
  report_generated_at    DateTime? @db.Timestamptz()
  report_expires_at      DateTime? @db.Timestamptz()
  report_error_message   String?
  report_created_at      DateTime  @default(now()) @db.Timestamptz()

  requested_by User? @relation(fields: [requested_by_user_id], references: [user_id], onDelete: SetNull)

  @@map("report")
}
```

---
### Running Migrations
```bash
# Create the database first (run once)
psql -U postgres -c "CREATE DATABASE escv_db;"

# Run the initial migration — generates SQL from schema.prisma
npx prisma migrate dev --name init

# Generate the Prisma client (TypeScript types)
npx prisma generate

# Inspect your database visually in the browser
npx prisma studio
```

After `npx prisma generate`, all 12 models are available as fully-typed TypeScript in your services:

```typescript
// Example — fully typed, IntelliSense works on every field
const shipment = await this.prisma.shipment.findMany({
  where: { shipment_status: 'in_transit' },
  include: { events: true, current_checkpoint: true },
});
```

### Seeding the Database
```bash
# Run the seed script
npx prisma db seed
```

Add this to `package.json` so Prisma knows where the seed file is:

```json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```

---
## Running the Server
```bash
# Development (auto-restart on file change)
npm run start:dev

# Production build
npm run build
npm run start:prod

# Watch mode
npm run start:debug
```

**Verify it works:**
```
GET http://localhost:PORT/api/v1/health
→ 200 OK { "status": "ok" }
```

---
## API Design
### Design Principles
Every endpoint in ESCV follows these rules without exception:

**1. Always versioned**
Every route is prefixed with `/api/v1/`. When breaking changes are needed, `/api/v2/` is introduced without removing v1.

**2. Always plural nouns, never verbs**
```
✓  GET /api/v1/shipments
✗  GET /api/v1/getShipments
```

**3. Nested routes for ownership**
```
GET /api/v1/shipments/:id/events      — events belong to a shipment
GET /api/v1/alerts/:id/read           — action on a specific alert
```

**4. HTTP verbs carry meaning**
```
GET     — read, never mutates
POST    — create a new resource
PUT     — replace a resource entirely
PATCH   — update specific fields
DELETE  — remove or deactivate
```

**5. Consistent response envelope**
Every response — success or error — returns this shape:
```json
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "SHIPMENT_NOT_FOUND",
    "message": "Shipment with id abc-123 does not exist.",
    "statusCode": 404
  }
}
```

**6. Pagination on all list endpoints**
```bash
GET /api/v1/shipments?page=1&limit=20&status=in_transit
```

---
### Base URL & Versioning
```bash
Development:  http://localhost:PORT/api/v1
```

---
### Authentication Endpoints
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/auth/register` | ✗ | — | Register new user |
| `POST` | `/auth/login` | ✗ | — | Login, returns access + refresh token |
| `POST` | `/auth/refresh` | ✗ | — | Exchange refresh token for new access token |
| `POST` | `/auth/logout` | ✓ | Any | Invalidate refresh token |
| `GET` | `/auth/me` | ✓ | Any | Get current authenticated user profile |
| `PUT` | `/auth/me/password` | ✓ | Any | Change own password |

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
      "user_first_name": "Ahmed"
    }
  }
}
```

---
### Organizations Endpoints
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/organizations` | ✓ | Admin, Regulator | List all organizations |
| `GET` | `/organizations/:id` | ✓ | Admin, Regulator | Get organization by ID |
| `POST` | `/organizations` | ✓ | Admin | Create organization |
| `PATCH` | `/organizations/:id` | ✓ | Admin | Update organization |
| `PATCH` | `/organizations/:id/deactivate` | ✓ | Admin | Deactivate organization |
| `GET` | `/organizations/:id/users` | ✓ | Admin | List users in organization |

---
### Users Endpoints
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/users` | ✓ | Admin | List all users |
| `GET` | `/users/:id` | ✓ | Admin | Get user by ID |
| `POST` | `/users` | ✓ | Admin | Create user |
| `PATCH` | `/users/:id` | ✓ | Admin | Update user |
| `PATCH` | `/users/:id/deactivate` | ✓ | Admin | Deactivate user |
| `DELETE` | `/users/:id` | ✓ | Admin | Hard delete user (restricted) |

---
### Shipments Endpoints
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/shipments` | ✓ | All | List shipments (role-filtered) |
| `GET` | `/shipments/:id` | ✓ | All | Get shipment detail |
| `POST` | `/shipments` | ✓ | Shipper, Admin | Create shipment |
| `PATCH` | `/shipments/:id` | ✓ | Shipper, Admin | Update shipment metadata |
| `PATCH` | `/shipments/:id/status` | ✓ | Carrier, Admin | Update shipment status |
| `PATCH` | `/shipments/:id/assign-carrier` | ✓ | Admin | Assign carrier organization |
| `DELETE` | `/shipments/:id` | ✓ | Admin | Cancel shipment (soft) |
| `GET` | `/shipments/:id/events` | ✓ | All | Full event timeline |
| `GET` | `/shipments/:id/alerts` | ✓ | All | Alerts for this shipment |

**Query parameters for list:**
```typescript
GET /shipments?status=in_transit&page=1&limit=20&origin_city=Alexandria
```

**Role-based filtering (automatic, enforced in service):**
- Shipper → only sees own organization's shipments
- Carrier → only sees assigned shipments
- Regulator / Admin → sees all shipments

---
### Tracking Endpoints
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/shipments/:id/events` | ✓ | All | Full append-only event timeline |
| `POST` | `/shipments/:id/events` | ✓ | Carrier, Admin | Record new shipment event |
| `GET` | `/shipments/:id/events/:eventId` | ✓ | All | Single event detail |

**Create event request body:**
```json
{
  "event_type": "checkpoint_arrival",
  "event_status": "at_checkpoint",
  "checkpoint_id": "uuid-of-checkpoint",
  "event_description": "Arrived at Alexandria Port customs gate",
  "event_latitude": 31.2001,
  "event_longitude": 29.9187,
  "event_occurred_at": "2026-06-15T10:30:00Z"
}
```

Events are **append-only**. No `PUT`, `PATCH`, or `DELETE` on events.

---
### Alerts Endpoints
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/alerts` | ✓ | All | Get alerts for current user |
| `GET` | `/alerts/unread-count` | ✓ | All | Count of unread alerts |
| `PATCH` | `/alerts/:id/read` | ✓ | All | Mark alert as read |
| `PATCH` | `/alerts/:id/resolve` | ✓ | Admin, Regulator | Mark alert as resolved |
| `GET` | `/alerts/:id` | ✓ | All | Alert detail |

---
### Dashboard Endpoints
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/dashboard/stats` | ✓ | All | KPI stats (role-filtered) |
| `GET` | `/dashboard/shipments/map` | ✓ | All | All active shipments with coordinates |
| `GET` | `/dashboard/ports/load` | ✓ | Regulator, Admin | Shipment count per checkpoint |
| `GET` | `/dashboard/carrier/performance` | ✓ | Admin, Regulator | Carrier delivery rates |

**Stats response (shipper view):**
```json
{
  "success": true,
  "data": {
    "total_shipments": 42,
    "in_transit": 18,
    "delivered": 20,
    "delayed": 3,
    "customs_hold": 1
  }
}
```

---
### Reports Endpoints
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/reports` | ✓ | Admin, Regulator | Request report generation (async) |
| `GET` | `/reports` | ✓ | Admin, Regulator | List generated reports |
| `GET` | `/reports/:id` | ✓ | Admin, Regulator | Report status + download link |

**Request report body:**
```json
{
  "report_type": "shipment_summary",
  "report_parameters": {
    "date_from": "2026-01-01",
    "date_to": "2026-06-30",
    "status": "delivered"
  }
}
```

Report generation is **async**. The API returns immediately with `report_status: "pending"`. A BullMQ job processes it. The client polls or receives a WebSocket push when `report_status` becomes `"completed"`.

---
### Audit Endpoints
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/audit` | ✓ | Admin | Browse audit log |
| `GET` | `/audit?resource_type=shipment&resource_id=uuid` | ✓ | Admin | Audit trail for specific resource |
| `GET` | `/audit?user_id=uuid` | ✓ | Admin | Audit trail for specific user |

Audit logs are **read-only**. No create, update, or delete endpoints.

---
### Health Endpoints
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/health` | ✗ | — | Application health status |
| `GET` | `/health/db` | ✗ | — | Database connectivity |
| `GET` | `/health/redis` | ✗ | — | Redis connectivity |

**Health response:**
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
Connect to `ws://localhost:3000` with a valid JWT Bearer token.

**Client → Server:**
| Event | Payload | Description |
|---|---|---|
| `join:shipment` | `{ shipmentId: string }` | Subscribe to a shipment's real-time room |
| `leave:shipment` | `{ shipmentId: string }` | Unsubscribe from a shipment room |
| `join:dashboard` | `{ role: string }` | Subscribe to role-based dashboard feed |

**Server → Client:**
| Event | Payload | Description |
|---|---|---|
| `shipment:updated` | `{ shipmentId, status, coordinates, timestamp }` | Shipment status or location changed |
| `alert:new` | `{ alertId, type, severity, message, shipmentId }` | New alert created for user |
| `dashboard:stats` | `{ activeShipments, delayed, portLoad }` | Periodic dashboard KPI push |
| `report:ready` | `{ reportId, fileUrl }` | Async report generation completed |

---
## Request & Response Flow
Every inbound HTTP request passes through this exact pipeline:
```typescript
1. Global Middleware
   └── Helmet          (security headers)
   └── Compression     (gzip responses)
   └── Pino Logger     (request logging)
   └── RequestId       (stamps X-Request-ID on every request)

2. ThrottlerGuard
   └── 100 requests / 60 seconds per IP
   └── Returns 429 Too Many Requests if exceeded

3. JwtAuthGuard
   └── Extracts Bearer token from Authorization header
   └── Verifies signature and expiry via JWT strategy
   └── Attaches user object to request: req.user
   └── Returns 401 Unauthorized if invalid

4. RolesGuard
   └── Reads @Roles() decorator on controller method
   └── Checks req.user.role against allowed roles
   └── Returns 403 Forbidden if role not permitted

5. ValidationPipe
   └── Parses and validates request body against DTO class
   └── Strips unknown properties (whitelist: true)
   └── Returns 400 Bad Request with field errors if invalid

6. Controller
   └── Receives typed, validated, authorized request
   └── Delegates to service — zero business logic in controller

7. Service
   └── All business logic lives here
   └── Calls repository for data access
   └── Emits domain events (EventEmitter2)
   └── Returns domain object to controller

8. Repository
   └── All Prisma queries live here
   └── Service never writes Prisma queries directly

9. ResponseInterceptor
   └── Wraps every successful response in { success: true, data: ... }
   └── Applied globally via app.useGlobalInterceptors()

10. GlobalExceptionFilter
    └── Catches all unhandled exceptions
    └── Returns consistent { success: false, error: { ... } }
    └── Logs error with full stack trace via Pino
```

---
## Validation & Security
### DTO Validation
Every request body is a class decorated with `class-validator`:

```typescript
// src/shipments/dto/create-shipment.dto.ts
import { IsString, IsUUID, IsOptional, IsNumber, Min, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShipmentDto {
  @ApiProperty({ example: 'Alexandria Port' })
  @IsString()
  @MaxLength(255)
  shipment_origin_city: string;

  @ApiProperty({ example: 'Cairo Logistics Hub' })
  @IsString()
  @MaxLength(255)
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

`ValidationPipe` with `whitelist: true` strips any properties not declared in the DTO. This prevents mass assignment attacks.

### Security Layers
| Layer | Implementation | Protection |
|---|---|---|
| Password hashing | `bcrypt` (rounds: 12) | Brute force, rainbow tables |
| Access tokens | JWT (15 min expiry) | Session hijacking |
| Refresh tokens | Hashed in DB, rotated on use | Token theft |
| Rate limiting | `@nestjs/throttler` (100 req/min) | Brute force, DDoS |
| HTTP headers | `helmet` | XSS, clickjacking, MIME sniffing |
| Input validation | `class-validator` + `whitelist: true` | Injection, mass assignment |
| Role enforcement | `RolesGuard` on every protected route | Privilege escalation |
| CORS | Restricted to `CLIENT_URL` env var | Cross-origin attacks |

---
## Module Responsibilities
| Module | Owns | Depends On |
|---|---|---|
| `AuthModule` | Login, register, token rotation | `UsersModule`, `PrismaModule` |
| `UsersModule` | User CRUD, role management | `PrismaModule` |
| `OrganizationsModule` | Organization CRUD | `PrismaModule` |
| `ShipmentsModule` | Shipment lifecycle, status | `PrismaModule`, events |
| `TrackingModule` | Shipment event log | `PrismaModule`, `NotificationsModule` |
| `AlertsModule` | Alert creation, user delivery | `PrismaModule`, `NotificationsModule` |
| `DashboardModule` | Aggregated KPIs, map data | `PrismaModule` |
| `ReportsModule` | Async report generation | `PrismaModule`, `BullMQ` |
| `AuditModule` | Append-only action log | `PrismaModule` |
| `NotificationsModule` | WebSocket gateway | `Socket.IO` |
| `HealthModule` | Health check endpoints | `@nestjs/terminus` |
| `PrismaModule` | Database client (global) | — |
| `ConfigModule` | Environment variables (global) | — |

---
## Development Workflow
### Adding a New Feature — Step by Step
Use shipments as your template. Every new module follows the exact same pattern.

```typescript
1. Create the module folder under src/
2. Create module file: feature.module.ts
3. Create controller: controllers/feature.controller.ts
4. Create service: services/feature.service.ts
5. Create repository: repositories/feature.repository.ts
6. Create DTOs: dto/create-feature.dto.ts
7. Register module in app.module.ts
8. Test with Postman
```

---
## Testing
```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# End-to-end tests
npm run test:e2e

# Coverage report
npm run test:cov
```

Test files live next to the code they test:
```typescript
users.service.ts
users.service.spec.ts   ← unit test
```
E2E tests live in `test/e2e/` and test full HTTP request/response flows.

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