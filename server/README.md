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
- [Prisma](#prisma)
- [Running the Server](#running-the-server)
- [Modules](#modules)
- [API Design](#api-design)
- [Endpoints](#endpoints)
- [WebSocket Events](#websocket-events)
- [Request and Response Flow](#request-and-response-flow)
- [Validation and Security](#validation-and-security)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [License](#license)

---

## Overview

The ESCV server is a **NestJS 11 modular monolith** running on **Fastify 5**. It exposes a versioned REST API, a real-time Socket.IO gateway, a mail delivery system, and an async event pipeline.

**RabbitMQ** (`@golevelup/nestjs-rabbitmq`, topic exchange `escv.events`) is the inter-module event bus: shipment status changes, alert creation, audit-log writes, invitation/password-reset emails, session revocation, and WebSocket broadcasts all flow through it. It is **required** — the server refuses to boot without `RABBITMQ_URL`.

**Redis** backs the auth session system: refresh tokens are stored as rotating "families" (`rt:`, `rt_family:`, `user_sessions:` sets), with reuse detection and token-version revocation.

**What is live today:**

- JWT auth with access + refresh token rotation (refresh token in a signed httpOnly cookie)
- Session management — list active sessions, revoke one or all, force-logout via WebSocket
- Five roles: `super_admin`, `admin`, `shipper`, `carrier`, `regulator`
- Organization management: invitations (with email + resend/cancel), members, org audit logs
- Full shipment lifecycle with an enforced state machine, carrier claiming, and route assignment
- Checkpoints and routes (with ordered checkpoint sequences)
- Alerts with unread count, mark-read, and resolve
- ETA delay scanner (`@nestjs/schedule`, midnight Africa/Cairo + boot catch-up)
- Reports (async generation), dashboard stats, and an OSRM-backed routing API
- Health endpoints and server-side pagination across all list endpoints

## Architecture

```text
Client (React)
      |
      v
NestJS API — Modular Monolith (Fastify)
      |
      |-- REST Controllers -> Guards -> Pipes -> Services -> Prisma -> PostgreSQL
      |
      |-- WebSocket Gateway -> Socket.IO -> user:<id> / page:<name> rooms
      |
      `-- RabbitMQ ("escv.events") -> consumers: email, alerts, audit, websocket
```

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 20.x LTS | JavaScript runtime |
| npm | 10.x | Package manager |
| PostgreSQL | 16.x | Primary database |
| Redis | 7.x | Sessions / queue state |
| RabbitMQ | 3.12+ | Event bus |
| Docker | Latest | Containerized services (recommended path) |

## Tech Stack

| Technology | Version | Role |
|---|---|---|
| NestJS | 11.x | Application framework |
| TypeScript | 5.x | Language |
| Fastify | 5.x | HTTP server (`@nestjs/platform-fastify`) |
| PostgreSQL | 16.x | Primary database |
| Prisma | 7.x | ORM + migrations (`@prisma/client`, `@prisma/adapter-pg`) |
| RabbitMQ | — | Event bus (`@golevelup/nestjs-rabbitmq`) |
| Redis / ioredis | 5.x | Sessions, reset tokens, caching |
| Socket.IO | 4.x | Real-time WebSocket |
| `@nestjs/jwt` | 11.x | Access tokens |
| Swagger | 11.x | API docs at `/api/docs` |
| Docker | Latest | Containerization |

## Environment Setup

### Step 1 — Copy the template

```bash
cp .env.example .env
```

### Step 2 — Fill in `.env`

```bash
# Application
NODE_ENV=development
PORT=8081
COOKIE_SECRET=
CORS_ORIGIN=http://localhost:5173
BCRYPT_SALT_ROUNDS=12
PASSWORD_RESET_TOKEN_TTL_MINUTES=15

# Database (localhost maps to the host-side POSTGRES_PORT, default 5432)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/escv_db"

# JWT
JWT_ACCESS_SECRET=
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRATION=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# RabbitMQ (credentials must match the root .env RABBITMQ_USER/RABBITMQ_PASS)
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# Mail (SMTP)
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=
MAIL_PASS=
MAIL_FROM="ESCV <noreply@escv.com>"

# OSRM (only needed when running outside Docker)
OSRM_URL=http://localhost:5000/route/v1/driving
OSRM_TIMEOUT_MS=8000
```

Generate secure secrets:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

`.env` is gitignored. Only `.env.example` is tracked. Note that `CORS_ORIGIN` is used both for CORS and as the base URL for emailed links (password reset, invitations).

## Installation

```bash
npm install
npx prisma generate
```

## Prisma

Prisma is the single source of truth for the database schema. Every query goes through the generated client — no raw SQL in services (except the health-check `SELECT 1`).

```bash
npx prisma migrate dev          # apply migrations
npx prisma db seed              # seed (creates super_admin: admin@escv.com / Admin@123)
npx prisma generate             # regenerate the client after schema changes
npx prisma studio               # visual database browser
```

The connection uses the Prisma 6+ adapter pattern via `prisma.config.ts` and `@prisma/adapter-pg`.

## Running the Server

```bash
npm run start:dev        # watch mode
npm run build            # compiles to dist/src/main.js
npm run start:prod       # node dist/src/main.js
npm run start:debug      # watch + debugger
```

Verify:

```bash
GET http://localhost:8081/api/health   ->  200 OK
GET http://localhost:8081/api/docs     ->  Swagger UI
```

## Modules

| Module | Owns | Depends On |
|---|---|---|
| `AuthModule` | Register, login, forgot/reset password, accept invitation, token rotation, sessions | Users, Prisma, Redis, RabbitMQ, Audit |
| `UsersModule` | User lookup by id/email, token-version bumps | Prisma |
| `OrganizationsModule` | Invitations, members, org audit logs (org admin) | Prisma, RabbitMQ, Audit |
| `ShipmentsModule` | Shipment lifecycle, state machine, carrier claiming, route assignment, events | Prisma, RabbitMQ, Audit |
| `CheckpointsModule` | Checkpoint CRUD (super_admin), paginated listing | Prisma |
| `RoutesModule` | Route CRUD (super_admin) + ordered checkpoint sequences | Prisma |
| `AdminModule` | Platform management (super_admin): users, orgs, shipments, invitations, audit logs, bulk actions | Prisma |
| `AlertsModule` | Alert creation/distribution, unread count, read/resolve | Prisma, RabbitMQ |
| `DashboardModule` | Role-scoped KPI stats | Prisma |
| `ReportsModule` | Async report generation (simulated), listing, download URL | Prisma |
| `MapModule` | OSRM driving routes with cache + retries | HTTP (OSRM) |
| `HealthModule` | `/health`, `/health/db`, `/health/redis` | Prisma, Redis |
| `WebsocketModule` | Socket.IO gateway + RabbitMQ consumer → live events | Redis, RabbitMQ |
| `AuditModule` | Append-only audit logging (service + RabbitMQ consumer) | Prisma, RabbitMQ |
| `MailModule` | SMTP via nodemailer (invitations, password reset) | Config |
| `QueueModule` | RabbitMQ connection + email consumer | RabbitMQ, Mail |
| `RedisModule` | Global ioredis client (`RedisService`) | Config |
| `PrismaModule` | Global database client | — |

## API Design

### Base URL and Versioning

All routes live under `/api` (`app.setGlobalPrefix('api')`). Breaking changes would introduce a versioned prefix such as `/api/v2` without removing existing routes.

```text
Development:   http://localhost:8081/api
Swagger UI:    http://localhost:8081/api/docs
```

### Conventions

- **Plural nouns, never verbs** — `GET /api/shipments`, not `/api/getShipments`.
- **Nested routes express ownership** — `GET /api/shipments/:id/events`, `POST /api/organizations/:orgId/invitations`.
- **HTTP verbs carry their meaning** — GET (read), POST (create), PATCH (partial update), PUT (replace), DELETE (remove/deactivate).

### Responses

Controllers return plain objects (no global `success` wrapper). Errors share a consistent shape produced by the global exception filter:

```json
{
  "statusCode": 404,
  "message": "Shipment not found",
  "timestamp": "2026-08-13T12:00:00.000Z",
  "path": "/api/shipments/abc"
}
```

Some handlers attach a machine-readable `reason` (e.g. `ACCOUNT_INACTIVE`), and validation errors collapse to a friendly message plus a count of additional issues.

### Pagination

List endpoints paginate server-side. `page` and `limit` are optional; defaults are applied when omitted.

| Parameter | Type | Default | Constraints |
|---|---|---|---|
| `page` | integer | 1 | min 1 |
| `limit` | integer | 10 (20 for shipments, admin views, reports, alerts) | min 1, max 100 |

Invalid values return `400`. The standard shape:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

## Endpoints

All endpoints require a Bearer access token unless marked **public**. Roles enforced by `RolesGuard`; note the five-role model (`super_admin`, `admin`, `shipper`, `carrier`, `regulator`).

### Health (public)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Overall health — DB + Redis (`200` ok / `503` degraded) |
| `GET` | `/api/health/db` | Database connectivity |
| `GET` | `/api/health/redis` | Redis connectivity |

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Create organization + admin user, returns `{ user, accessToken }` and sets refresh cookie |
| `POST` | `/api/auth/login` | Public | Login, returns `{ user, accessToken }` + refresh cookie |
| `POST` | `/api/auth/forgot-password` | Public | Emails a single-use reset link |
| `POST` | `/api/auth/reset-password` | Public | Consume token, set new password, revoke all sessions |
| `POST` | `/api/auth/refresh` | Public | Rotate refresh cookie, returns `{ accessToken }` |
| `POST` | `/api/auth/logout` | Public | Invalidate the refresh token, clear cookie |
| `GET` | `/api/auth/invitation` | Public | Invitation details by token |
| `POST` | `/api/auth/accept-invitation` | Public | Create account from an invitation |
| `GET` | `/api/auth/me` | Yes | Current user profile |
| `PATCH` | `/api/auth/me` | Yes | Update profile (name, phone) |
| `PATCH` | `/api/auth/me/password` | Yes | Change password (revokes other sessions) |
| `GET` | `/api/auth/sessions` | Yes | Paginated active sessions |
| `DELETE` | `/api/auth/sessions/:sessionId` | Yes | Revoke one session |
| `DELETE` | `/api/auth/sessions` | Yes | Revoke all except current |

Register body (camelCase):

```json
{
  "email": "ahmed@escv.eg",
  "password": "SecurePass123!",
  "firstName": "Ahmed",
  "lastName": "Medhat",
  "phone": "+201234567890",
  "organizationName": "Maersk Egypt",
  "organizationType": "shipper",
  "organizationEmail": "contact@maersk-egypt.eg"
}
```

> The registering user is always created as the organization's **admin** — organization type does not determine the account role.

### Organizations (org `admin`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/organizations/:orgId/invitations` | Invite a user by email |
| `GET` | `/api/organizations/:orgId/invitations` | Paginated invitations (status filter) |
| `POST` | `/api/organizations/:orgId/invitations/:invitationId/resend` | Resend a pending invitation |
| `DELETE` | `/api/organizations/:orgId/invitations/:invitationId` | Cancel a pending invitation |
| `GET` | `/api/organizations/:orgId/members` | Paginated member directory |
| `PATCH` | `/api/organizations/:orgId/members/:userId/deactivate` | Deactivate a member |
| `PATCH` | `/api/organizations/:orgId/members/:userId/activate` | Activate a member |
| `GET` | `/api/organizations/:orgId/audit-logs` | Org-scoped audit log |

Organization CRUD lives under `/api/admin/*` (super_admin).

### Shipments

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| `GET` | `/api/shipments` | All | Paginated list — role-filtered automatically |
| `GET` | `/api/shipments/:id` | All | Shipment detail (role-filtered) |
| `GET` | `/api/shipments/:id/events` | All | Append-only event timeline (paginated, newest first) |
| `POST` | `/api/shipments` | shipper, admin | Create shipment (shipper org required) |
| `PUT` | `/api/shipments/:id` | shipper, admin | Update metadata |
| `PATCH` | `/api/shipments/:id/status` | All (service-enforced) | Transition status — validated by the state machine |
| `PATCH` | `/api/shipments/:id/route` | shipper, admin, carrier, super_admin | Assign/change route |
| `POST` | `/api/shipments/:id/accept` | carrier, admin, super_admin | Carrier claims a shipment |
| `DELETE` | `/api/shipments/:id` | shipper, admin | Delete a **draft** shipment |

**Role-based visibility** is enforced in the service: shippers see their org's shipments, carriers see assigned/claimable ones, regulators and super admins see all.

**State machine** (`shipments.constants.ts`) — invalid transitions return `400 Bad Request`; same-status updates are a no-op:

```text
draft            -> confirmed, cancelled
confirmed        -> picked_up, cancelled
picked_up        -> in_transit, cancelled
in_transit       -> at_checkpoint, out_for_delivery, delayed, cancelled
at_checkpoint    -> customs_hold, customs_cleared, in_transit
customs_hold     -> customs_cleared, cancelled
customs_cleared  -> in_transit, out_for_delivery
out_for_delivery -> delivered, cancelled
delivered        -> (terminal)
delayed          -> in_transit, cancelled
cancelled        -> draft, confirmed     (restore — super_admin / shipper org admin)
```

### Checkpoints

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| `GET` | `/api/checkpoints` | All | Paginated list (search) |
| `GET` | `/api/checkpoints/:id` | All | Detail with coordinates |
| `POST` | `/api/checkpoints` | super_admin | Create |
| `PUT` | `/api/checkpoints/:id` | super_admin | Update |
| `DELETE` | `/api/checkpoints/:id` | super_admin | Soft-delete (deactivate) |
| `PATCH` | `/api/checkpoints/:id/activate` | super_admin | Activate |
| `PATCH` | `/api/checkpoints/:id/deactivate` | super_admin | Deactivate |

### Routes

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| `GET` | `/api/routes` | All | Paginated list (search, active filter) |
| `GET` | `/api/routes/:id` | All | Detail with ordered checkpoints |
| `POST` | `/api/routes` | super_admin | Create |
| `PUT` | `/api/routes/:id` | super_admin | Update |
| `DELETE` | `/api/routes/:id` | super_admin | Soft-delete (deactivate) |
| `PATCH` | `/api/routes/:id/activate` / `:id/deactivate` | super_admin | Activate / deactivate |
| `POST` | `/api/routes/:routeId/checkpoints` | super_admin | Add a checkpoint at a sequence order |
| `DELETE` | `/api/routes/:routeId/checkpoints/:checkpointId` | super_admin | Remove a checkpoint |

### Admin (super_admin)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/dashboard` | Platform overview stats |
| `GET` | `/api/admin/users` | All users (search, role, active filters) |
| `GET` | `/api/admin/users/:id` | User detail |
| `PATCH` | `/api/admin/users/:id` | Update user (name, phone, role, org, password) |
| `PATCH` | `/api/admin/users/:id/deactivate` / `:id/activate` | Deactivate / activate |
| `DELETE` | `/api/admin/users/:id` | Delete user |
| `GET` | `/api/admin/organizations` | All organizations |
| `GET` | `/api/admin/organizations/:id` | Organization detail |
| `PATCH` | `/api/admin/organizations/:id` | Update organization |
| `PATCH` | `/api/admin/organizations/:id/deactivate` / `:id/activate` | Deactivate / activate |
| `GET` | `/api/admin/shipments` | All shipments (filters) |
| `GET` | `/api/admin/shipments/:id` | Any shipment detail |
| `PATCH` | `/api/admin/shipments/:id/status` | Force a status change |
| `POST` | `/api/admin/bulk-action` | Bulk activate/deactivate/delete/cancel |
| `GET` | `/api/admin/invitations` | All platform invitations (paginated) |
| `GET` | `/api/admin/audit-logs` | Platform audit log (paginated, filterable) |

### Alerts

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/alerts` | Paginated alerts for the current user (read/severity/search filters) |
| `GET` | `/api/alerts/unread-count` | Unread count |
| `PATCH` | `/api/alerts/read-all` | Mark all as read |
| `PATCH` | `/api/alerts/:id/read` | Mark one as read |
| `PATCH` | `/api/alerts/:id/resolve` | Mark an alert resolved (org-scoped) — `admin`, `super_admin` |

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/stats` | Role-scoped KPI statistics (counts, status distribution, open critical alerts) |

### Reports

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reports` | Paginated reports for the current user |
| `POST` | `/api/reports` | Request report generation (returns `pending`) |
| `GET` | `/api/reports/:id/download` | Download URL once `completed` |

Generation is asynchronous and simulated in-process (a 3 s delay marks the report complete) — no queue worker is involved.

### Map

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/map/route?from=lat,lng&to=lat,lng` | OSRM driving route: geometry, distance, duration (cached 24 h, 3 retries) |

### WebSocket

Connect to `ws://localhost:8081` with the access token in the handshake `auth.token` (or `Authorization: Bearer`). The gateway rejects sockets whose session is no longer alive in Redis.

**Client → server:**

| Event | Payload | Description |
|---|---|---|
| `join_page` | `"shipments"` | Join a page-scoped room (leaves previous) |
| `leave_page` | `"shipments"` | Leave the current page room |

**Server → client:**

| Event | Payload | Description |
|---|---|---|
| `shipment:updated` | shipment event payload | Status/location changed — fanned out only to viewers with permission |
| `alert:new` | alert payload | New alert for the recipient's `user:<id>` room |
| `auth_required` | — | Token invalid/expired — refresh and reconnect |
| `force_logout` | `{ reason: 'session_revoked' }` | Session revoked — log out |

## Request and Response Flow

```text
1. @fastify/helmet            HTTP security headers
2. ThrottlerGuard             global: 100 req/60 s per IP (auth: 5/60 s)
3. JwtAuthGuard (global)      verify Bearer token · attach req.user · 401 (skip via @Public)
4. RolesGuard (global)        check @Roles() against user.role · 403
5. ValidationPipe             whitelist + forbidNonWhitelisted + transform · 400
6. Controller                 route handler — zero business logic
7. Service                    business rules · publish domain events to RabbitMQ
8. PrismaService              all data access
9. RequestContextInterceptor  bind FastifyRequest to async-local storage (audit)
10. AllExceptionsFilter       consistent error shape · logs via Fastify's pino logger
```

## Validation and Security

| Layer | Tool | What it protects against |
|---|---|---|
| Password hashing | bcrypt (12 rounds) | Brute force, leaked DB |
| Access tokens | JWT — 15 min expiry | Session hijacking |
| Refresh tokens | Redis family + rotation + reuse detection | Token theft/replay |
| Session management | list/revoke + WebSocket force-logout | Stolen sessions |
| Rate limiting | `@nestjs/throttler` — 100 req/60 s (auth: 5/60 s) | Brute force, abuse |
| HTTP headers | `@fastify/helmet` | XSS, clickjacking, MIME sniffing |
| Input validation | `class-validator` + whitelist | Injection, mass assignment |
| Role enforcement | `RolesGuard` on protected routes | Privilege escalation |
| CORS | Restricted to `CORS_ORIGIN` | Cross-origin abuse |
| Cookies | Signed httpOnly refresh cookie (`@fastify/cookie`) | Token exfiltration via XSS |

## Development Workflow

1. Create the module folder under `src/<feature>/` with `feature.module.ts`, `controllers/`, `services/`, `dto/`.
2. Register the module in `app.module.ts`.
3. Add Swagger decorators to all controller methods.
4. Add pagination to list endpoints.
5. Write unit tests next to the files they test (`*.spec.ts`).
6. Update `README.md`.

**Git workflow:** work on feature branches (`feat/module-name`), open a pull request, review before merging. Commit format: `feat(scope):`, `fix(scope):`, `refactor(scope):`, `style(scope):`, `docs:`, `chore:`.

## Testing

```bash
npm run test          # unit tests (Jest)
npm run test:watch
npm run test:cov      # coverage
npm run test:e2e      # end-to-end (Supertest, requires real infra)
```

Unit tests live next to the files they test; e2e tests live in `test/` and boot the full `AppModule`.

## License

**PROPRIETARY LICENSE** — © 2026 Egypt Supply Chain Visibility Team. All Rights Reserved.

This project is a university capstone project developed to demonstrate full-stack engineering skills applied to a real national infrastructure problem. This software and associated documentation are proprietary and confidential.
