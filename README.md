# Egypt Supply Chain Visibility (ESCV)

> Developed by **Ahmed Medhat**, **Ahmed Tarek** & **Lucas Monir**

<div align="center">
  <img src="./docs/assets/escv-logo.png" alt="ESCV Logo" width="800" />
</div>

**Project type:** Full-Stack Web Application
**License:** Proprietary — All rights reserved

---

## Table of Contents

- [Overview](#overview)
- [What ESCV Does](#what-escv-does)
- [System Structure](#system-structure)
- [Repository Structure](#repository-structure)
- [Technology Stack](#technology-stack)
- [Role-Based Access Control](#role-based-access-control)
- [Key Technical Decisions](#key-technical-decisions)
- [Docker Environment](#docker-environment)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [API Documentation](#api-documentation)
- [CI/CD](#cicd)
- [Project Documentation](#project-documentation)
- [License](#license)

---

## Overview

ESCV is a supply chain visibility platform that gives shippers, carriers, regulators, and platform administrators real-time visibility into shipment movement across Egypt's logistics ecosystem. It was built as a university capstone project.

The backend is a **NestJS modular monolith** on **Fastify** with **RabbitMQ** as the inter-module event bus, **Redis** for refresh-token/session state, a **Socket.IO** gateway for live updates, and a self-hosted **OSRM** instance for driving routes. The frontend is a **React + TypeScript** SPA with role-based dashboards and a live map.

## What ESCV Does

Most shipment tracking in Egypt's logistics chain depends on manual coordination. ESCV gives every party a shared, real-time view of shipment state:

- **Shippers** create shipments and track their cargo through its lifecycle.
- **Carriers** claim shipments, update status/location, and get assigned-route guidance.
- **Regulators** get a read-only, organization-wide view of shipment and checkpoint activity.
- **Org Admins** manage their organization's members, invitations, and audit logs.
- **Super Admins** (platform) manage users, organizations, shipments, routes, checkpoints, and the platform-wide audit log.

## System Structure

```text
Client (React SPA)
   │  REST (axios)                    WebSocket (socket.io)
   ▼                                       ▼
NestJS API ─────────────────────► Socket.IO Gateway (user:/page: rooms)
   │
   ├── Controllers → Guards (JWT + Roles) → Pipes → Services → Prisma → PostgreSQL
   ├── RabbitMQ event bus ("escv.events") — shipments, alerts, audit, email,
   │   session revocation, and WebSocket fan-out all flow through it
   ├── Redis — refresh-token families, sessions, password-reset tokens
   ├── BullMQ-free: all async work is RabbitMQ consumers
   └── @nestjs/schedule — midnight (Africa/Cairo) ETA-delay scanner + boot catch-up
```

### Authentication

JWT-based authentication with bcrypt password hashing. Access and refresh tokens use independent secrets and expirations (`JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`). The refresh token is a random UUID delivered in a **signed, httpOnly cookie** (`path=/api/auth`) and stored in **Redis as a rotating "family"** — every refresh rotates the token, old tokens are marked consumed, and reuse is detected and revoked. Sessions can be listed and revoked (individually or all at once).

![Authentication Flow](./docs/assets/designs/authentication-flow.png)

### Request Handling

Requests pass through NestJS's standard pipeline: `@fastify/helmet` security headers, the global `ThrottlerGuard` (100 req / 60 s per IP; stricter on auth endpoints), the global `JwtAuthGuard` + `RolesGuard`, and a whitelisting `ValidationPipe` (`class-validator` / `class-transformer`). An async-local-storage interceptor binds the Fastify request for audit logging. Fastify's built-in (pino-based) logger produces structured JSON logs.

![Request and Response Lifecycle](./docs/assets/designs/request-response-lifecycle.png)

### Real-Time Updates

Socket.IO pushes events instead of polling. Clients authenticate with the access token (`auth.token` handshake or Bearer header); the gateway verifies the session is still alive in Redis. Clients join `page:<name>` rooms, and the gateway fans out `shipment:updated`, `alert:new`, `auth_required`, and `force_logout` events with per-role visibility checks.

![WebSocket Events](./docs/assets/designs/websocket-events.png)

### Background Processing

RabbitMQ (via `@golevelup/nestjs-rabbitmq`, topic exchange `escv.events`) is the event backbone: invitation/password-reset emails, alerts, audit-log writes, and WebSocket broadcasts are all published as events and consumed asynchronously. `@nestjs/schedule` runs the ETA delay scanner daily at midnight (Africa/Cairo) plus a catch-up scan 10 s after boot.

## Repository Structure

```text
egypt-supply-chain-visibility/
│
├── client/                  React + TypeScript SPA (Vite)
│   └── README.md            Client setup, structure, and features
│
├── server/                  NestJS backend (Fastify)
│   └── README.md            Server setup, API reference, module docs
│
├── database/                Schema design artifacts (ERD, legacy schema.sql)
│   └── README.md            Database documentation
│   └── The runtime schema is owned by Prisma migrations in server/prisma/
│
├── osrm/                    Dockerfile building a self-hosted OSRM (Egypt MLD)
│
├── docs/                    Engineering audit, design assets, presentations
│
├── .github/workflows/       CI, Docker publishing, nightly OSRM refresh
├── docker-compose.yml       Full local stack in one command
├── .env.example             Root environment template
└── README.md                This file
```

`client/` and `server/` are independent applications, each with its own `package.json` and `.env`. `database/` holds **design artifacts** — the actual runtime schema is owned by **Prisma migrations** inside `server/prisma/`.

## Technology Stack

### Backend

| Technology | Role |
|---|---|
| NestJS 11 + TypeScript 5 | Application framework |
| Fastify 5 (`@nestjs/platform-fastify`) | HTTP server |
| PostgreSQL 16 | Primary relational database |
| Prisma 7 (`@prisma/client`, `@prisma/adapter-pg`) | ORM, migrations, typed client |
| RabbitMQ (`@golevelup/nestjs-rabbitmq`) | Inter-module event bus / async processing |
| Redis + ioredis | Refresh-token sessions, reset tokens, caching |
| Socket.IO (`@nestjs/websockets`) | Real-time WebSocket updates |
| `@nestjs/jwt` + bcrypt | Authentication (access/refresh tokens, password hashing) |
| `class-validator` / `class-transformer` | Request validation and shaping |
| Joi | Environment schema validation |
| `@fastify/helmet` | HTTP security headers |
| `@nestjs/throttler` | Rate limiting (100 req/60 s global) |
| `@nestjs/schedule` | Cron: midnight ETA delay scanner |
| Swagger (`@nestjs/swagger`) | API documentation at `/api/docs` |
| Nodemailer | Outbound email (invitations, password reset) |
| Jest + Supertest | Unit and end-to-end tests |
| tsx | TypeScript execution (Prisma seed) |

### Frontend

| Technology | Role |
|---|---|
| React 19 + React DOM | UI library |
| TypeScript 6 | Language |
| Vite 8 | Build tool and dev server |
| React Router 7 | Client-side routing |
| TanStack Query 5 | Server-state fetching and caching |
| Zustand 5 | Client state: auth session, theme, live-socket feed |
| Axios | HTTP client (silent token refresh interceptor) |
| React Hook Form 7 + Zod 4 + `@hookform/resolvers` | Forms and validation |
| Socket.IO Client 4 | WebSocket connection (`src/services/socket.ts`) |
| Leaflet + React Leaflet + Leaflet MarkerCluster | Live map and map pickers |
| Tailwind CSS 4 (`@tailwindcss/vite`) | Styling |
| React Icons (Font Awesome set) | Iconography |
| React Hot Toast | Notifications |
| clsx + tailwind-merge | Conditional class merging (`cn()`) |

### Infrastructure

| Technology | Role |
|---|---|
| PostgreSQL 16 (Alpine) | Database container |
| Redis 7 (Alpine) | Cache / session container |
| RabbitMQ 3.12 Management (Alpine) | Message broker with management UI |
| OSRM (self-built, Egypt extract, MLD) | Routing engine for `/api/map/route` |
| pgAdmin | Web-based PostgreSQL administration |
| Docker + Docker Compose | Local orchestration of the full stack |

## Role-Based Access Control

Access control is enforced server-side by a global `RolesGuard`. **Five roles** exist:

| Role | Capabilities |
|---|---|
| **super_admin** | Platform-wide administration — users, organizations, shipments, routes, checkpoints, invitations, audit logs (`/api/admin/*`) |
| **admin** | Organization administration — members, invitations, org audit logs, and shipment management for their org |
| **shipper** | Create and track own shipments |
| **carrier** | Claim and update assigned shipments (status, route) |
| **regulator** | Read-only, organization-wide visibility |

Self-registration (`POST /api/auth/register`) creates a new organization and makes the registering user its **admin**.

## Key Technical Decisions

| Area | Decision |
|---|---|
| Backend framework | NestJS 11 on Fastify, organized as feature modules |
| Inter-module communication | RabbitMQ topic exchange (`escv.events`) — durable, decoupled, async |
| Real-time updates | Socket.IO with per-role visibility and live session checks |
| Token strategy | Access JWT (15 m) + refresh token in an httpOnly signed cookie, rotated in Redis with reuse detection |
| Session management | Redis-backed session families — list, revoke one, revoke all |
| Database | PostgreSQL via Prisma, UUID primary keys, snake_case naming |
| Routing | Self-hosted OSRM with Egypt OSM extract (MLD), cached + retried in `MapService` |
| API docs | Generated from code via `@nestjs/swagger` |

## Docker Environment

`docker-compose.yml` defines **seven services**: `postgres`, `redis`, `rabbitmq`, `pgadmin`, `osrm`, `server`, and `client`. Compose creates an internal network where services reach each other by **service name**, not `localhost`.

### Docker Services

| Service | Image / Build | Container Port | Host Port (via) | Volume |
|---|---|---|---|---|
| postgres | `postgres:16-alpine` | 5432 | `POSTGRES_PORT` (5432) | `postgres_data` |
| redis | `redis:7-alpine` | 6379 | `REDIS_PORT` | `redis_data` |
| rabbitmq | `rabbitmq:3.12-management-alpine` | 5672 / 15672 | `RABBITMQ_AMQP_PORT` / `RABBITMQ_MANAGEMENT_PORT` | `rabbitmq_data` |
| pgadmin | `dpage/pgadmin4:latest` | 80 | `PGADMIN_PORT` | `pgadmin_data` |
| osrm | built from `./osrm` (Egypt extract, MLD) | 5000 | `OSRM_PORT` (5000) | — (data baked into image) |
| server | built from `./server/Dockerfile` | 8081 | 8081 | — |
| client | built from `./client/Dockerfile` (nginx) | 80 | 5173 | — |

### Service Networking

```text
server → postgres:5432
server → redis:6379
server → rabbitmq:5672
server → osrm:5000
client → server:8081   (nginx proxies /api/ and /socket.io/)
```

From the host (browser or terminal), use `localhost` with the **host-mapped** ports. Inside the `server` container, `localhost` refers to the container itself.

### Health Checks

- PostgreSQL: `pg_isready` · Redis: `redis-cli ping` · RabbitMQ: `rabbitmq-diagnostics ping` · OSRM: TCP connect to port 5000
- **Server: `GET /api/health`** (Node fetch) — the `client` service starts only after the server reports healthy.

## Environment Variables

Three `.env` files exist, each with a distinct role. None are committed — only `.env.example` templates are tracked.

```text
Root
├── .env                → read by Docker Compose (infra + app secrets)
├── server/.env         → used when running the backend directly on the host
└── client/.env         → frontend build-time config (VITE_* only)
```

### Root `.env` (Docker Compose)

```bash
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=escv_db
POSTGRES_PORT=5432          # host-side; container is always 5432

# Redis
REDIS_PORT=6379

# RabbitMQ
# NOTE: the official rabbitmq image refuses "guest" as RABBITMQ_DEFAULT_USER.
RABBITMQ_USER=guest
RABBITMQ_PASS=guest
RABBITMQ_AMQP_PORT=5672
RABBITMQ_MANAGEMENT_PORT=15672

# pgAdmin
PGADMIN_EMAIL=admin@escv.com
PGADMIN_PASSWORD=admin
PGADMIN_PORT=5050

# OSRM (self-hosted routing)
OSRM_PORT=5000
# OSRM_REGION=egypt
# OSRM_PBF_URL=https://download.geofabrik.de/africa/egypt-latest.osm.pbf
# OSRM_IMAGE_TAG=latest

# Backend application secrets (injected into the server container by Compose)
JWT_ACCESS_SECRET=          # node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRATION=7d
COOKIE_SECRET=
CORS_ORIGIN=http://localhost:5173
BCRYPT_SALT_ROUNDS=12
PASSWORD_RESET_TOKEN_TTL_MINUTES=15

# Mail (SMTP)
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=
MAIL_PASS=
MAIL_FROM="ESCV <noreply@escv.com>"
```

Compose derives `NODE_ENV`, `PORT`, `DATABASE_URL`, `REDIS_HOST`, `RABBITMQ_URL`, and `OSRM_URL` from the service names — no need to set them manually under Docker.

### Server `.env` (manual host development)

Used only when running the backend directly on the host. Mirrors the same variable names with host-appropriate values (services reached via host-mapped ports):

```bash
NODE_ENV=development
PORT=8081
COOKIE_SECRET=
CORS_ORIGIN=http://localhost:5173
BCRYPT_SALT_ROUNDS=12
PASSWORD_RESET_TOKEN_TTL_MINUTES=15

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/escv_db"

JWT_ACCESS_SECRET=
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRATION=7d

REDIS_HOST=localhost
REDIS_PORT=6379

RABBITMQ_URL=amqp://guest:guest@localhost:5672

MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=
MAIL_PASS=
MAIL_FROM="ESCV <noreply@escv.com>"

OSRM_URL=http://localhost:5000/route/v1/driving
OSRM_TIMEOUT_MS=8000
```

### Client `.env`

Only `VITE_`-prefixed variables are exposed to the browser:

```bash
# Empty = same-origin (Vite dev proxy / nginx), or set the backend directly:
VITE_API_BASE_URL=
```

### Docker vs Local Development

| Context | PostgreSQL | Redis | RabbitMQ |
|---|---|---|---|
| Inside Docker (server container) | `postgres:5432` | `redis:6379` | `rabbitmq:5672` |
| On the host (manual `npm run start:dev`) | `localhost:5432` | `localhost:6379` | `localhost:5672` |

## Getting Started

### Prerequisites

| Tool | Notes |
|---|---|
| Node.js 20.x LTS | Required for both `client/` and `server/` |
| npm 10.x | Package manager for both applications |
| Docker + Docker Compose | Recommended path — provides PostgreSQL, Redis, RabbitMQ, pgAdmin, and OSRM |

### Quick Start with Docker

```bash
git clone <repository-url>
cd egypt-supply-chain-visibility

cp .env.example .env
# fill in the secrets (JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, COOKIE_SECRET, MAIL_*)

docker compose up --build
```

Once running:

```text
Frontend:  http://localhost:5173
Backend:   http://localhost:8081/api
Swagger:   http://localhost:8081/api/docs
pgAdmin:   http://localhost:5050
RabbitMQ:  http://localhost:15672
```

Stop with `docker compose down`. Rebuild after dependency/Dockerfile changes with `docker compose up --build`.

### Running the Backend Manually

```bash
docker compose up postgres redis rabbitmq osrm -d

cd server
cp .env.example .env
# fill in server/.env (DATABASE_URL / REDIS_HOST / RABBITMQ_URL point at localhost)

npm install
npx prisma migrate dev      # apply migrations
npm run seed                # creates super_admin (admin@escv.com / Admin@123)
npm run start:dev
```

### Running the Frontend Manually

```bash
cd client
cp .env.example .env
# fill in client/.env (leave VITE_API_BASE_URL empty to use the Vite dev proxy)

npm install
npm run dev
```

The Vite dev server proxies `/api` and `/socket.io` to `http://localhost:8081`, so the frontend and backend can run on different ports without CORS friction. In Docker, the nginx container performs the same proxying for the built SPA.

## Development Workflow

### Server Scripts

| Script | Purpose |
|---|---|
| `npm run build` | Compile the NestJS application (`dist/src/main.js`) |
| `npm run start` | Run from source |
| `npm run start:dev` | Watch mode for local development |
| `npm run start:debug` | Watch mode with debugger attached |
| `npm run start:prod` | Run the production build (`node dist/src/main.js`) |
| `npm run lint` | Lint and auto-fix |
| `npm run test` / `test:watch` / `test:cov` | Unit tests (Jest) |
| `npm run test:e2e` | End-to-end tests (Supertest) |
| `npm run seed` / `npm run seed:run` | Seed the database (tsx) |

Prisma commands run directly, e.g. `npx prisma migrate dev`, `npx prisma generate`, `npx prisma db seed`, `npx prisma studio`.

### Client Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server (port 5173) |
| `npm run build` | Type-check (`tsc -b`) + production build |
| `npm run lint` | Lint |
| `npm run preview` | Preview the production build |

## API Documentation

The backend uses `@nestjs/swagger` to generate API documentation from code. Swagger UI is served at **`http://localhost:8081/api/docs`**. Detailed endpoint-level documentation lives in the generated Swagger output and in [`server/README.md`](./server/README.md).

## CI/CD

Three GitHub Actions workflows live in `.github/workflows/`:

| Workflow | Purpose |
|---|---|
| `ci.yml` | On every push/PR: server Prisma validation + typecheck + unit tests, client production build, and e2e tests booting the full `AppModule` against real PostgreSQL/Redis/RabbitMQ |
| `docker-publish.yml` | Builds and pushes `escv-server`, `escv-client`, and `escv-osrm` images to GHCR on main pushes and version tags |
| `osrm-nightly.yml` | Nightly (03:00 UTC) rebuild of the OSRM image from the latest Geofabrik Egypt extract |

See [`CI-CD.md`](./CI-CD.md) for the full pipeline walkthrough.

## Project Documentation

| Document | Location | Contents |
|---|---|---|
| Server | `server/README.md` | NestJS setup, API reference, module documentation |
| Client | `client/README.md` | React setup, structure, state management, features |
| Database | `database/README.md` | Schema documentation, naming conventions, design decisions |
| Engineering Audit | `docs/ESCV — Full Engineering Audit.md` | Deep architectural and security audit of the system |
| Audit Guide | `docs/Using the engineering audit.md` | How to work through the audit findings |
| CI/CD | `CI-CD.md` | CI/CD pipeline documentation |
| Git/GitHub | `GIT-GITHUB.md` | Git workflow and GitHub usage guide |
| Workflow | `WORKFLOW.md` | Team development workflow |

## License

**PROPRIETARY LICENSE** — © 2026 Egypt Supply Chain Visibility Team. All Rights Reserved.

This project is a university capstone project. This software and associated documentation are proprietary and confidential. No part may be reproduced, distributed, or transmitted in any form without prior written permission from the authors.

---

<div align="center">
  <strong>Bringing visibility to Egypt's supply chains.</strong>
</div>
