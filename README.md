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
- [How the System Is Structured](#how-the-system-is-structured)
- [Repository Structure](#repository-structure)
- [Technology Stack](#technology-stack)
- [Role-Based Access Control](#role-based-access-control)
- [Key Technical Decisions](#key-technical-decisions)
- [Docker Environment](#docker-environment)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [API Documentation](#api-documentation)
- [Project Documentation](#project-documentation)
- [Important Configuration Notes](#important-configuration-notes)
- [License](#license)

---
## Overview
ESCV is a supply chain visibility platform focused on giving shippers, carriers, regulators, and administrators visibility into shipment movement across Egypt's logistics ecosystem. It was built as a university capstone project.

---
## What ESCV Does
Most shipment tracking in Egypt's logistics chain still depends on manual coordination — phone calls, paper forms, and disconnected spreadsheets. When a shipment is delayed or held, the people who need to know (the shipper, the carrier, the regulator) often find out late, or not at all.

ESCV addresses this by giving every party a shared, real-time view of shipment state:
- **Shippers** create shipments and track their cargo
- **Carriers** update shipment status and location for shipments assigned to them
- **Regulators** get a read-only, organization-wide view of shipment and checkpoint activity
- **Administrators** manage users, organizations, and platform configuration

---
## How the System Is Structured
### Authentication
The backend uses JWT-based authentication with `bcrypt` for password hashing. Access and refresh tokens are issued separately, using distinct secrets and expirations (`JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`), which are configured through environment variables rather than hardcoded.

![Authentication Flow](./docs/assets/designs/authentication-flow.png)

---
### Request Handling
The backend is a NestJS application running on Fastify. Requests pass through NestJS's standard pipeline of middleware, guards, and validation pipes (via `class-validator` / `class-transformer`) before reaching a controller. `Helmet` and `@nestjs/throttler` are used for HTTP security headers and rate limiting.

![Request and Response Lifecycle](./docs/assets/designs/request-response-lifecycle.png)

---
### Real-Time Updates
Socket.IO is used for real-time, bidirectional communication between the backend and connected clients, allowing status changes to be pushed to the frontend instead of requiring polling.

### Background Processing
The backend uses Redis via `ioredis` together with `BullMQ` for background job processing, and RabbitMQ (via `@golevelup/nestjs-rabbitmq`) as a message broker. Specific job types are implementation details that live in the server codebase rather than this document.

![WebSocket Events](./docs/assets/designs/websocket-events.png)

---
## Repository Structure
```js
egypt-supply-chain-visibility/
|
|-- client/              React + TypeScript frontend application
|   `-- README.md        Setup, structure, and development guide
|
|-- server/               NestJS backend application
|   `-- README.md        Setup, API reference, and module documentation
|
|-- database/             Database design artifacts
|   |-- erd/              Entity relationship diagrams
|   |-- schema.sql        PostgreSQL DDL
|   `-- README.md         Schema documentation and design decisions
|
|-- docs/                 Project-wide documentation and design assets
|   |-- assets/           Diagrams, logo, and other static documentation assets
|   `-- presentations/    Presentation materials
|
|-- docker-compose.yml    Runs the full stack locally with one command
|-- .env.example          Root environment variable template
`-- README.md             This file
```

`client/` and `server/` are independent applications, each with its own `package.json` and its own `.env` file. `database/` holds schema **design artifacts** (ERDs, raw SQL) — the actual runtime schema is owned by Prisma migrations inside `server/prisma/`, independently of this folder. `docs/` holds non-code project material such as diagrams and presentations.

---
## Technology Stack
### Backend
| Technology | Role |
|---|---|
| NestJS | Backend application framework |
| TypeScript | Language |
| Fastify | HTTP server, via `@nestjs/platform-fastify` |
| PostgreSQL | Primary relational database |
| Prisma (`@prisma/client`, `@prisma/adapter-pg`) | ORM, migrations, typed database client |
| Redis + ioredis | In-memory store, used as the queue backend |
| BullMQ | Background job queue |
| RabbitMQ + `@golevelup/nestjs-rabbitmq` | Message broker |
| Socket.IO | Real-time WebSocket communication |
| JWT + bcrypt | Authentication and password hashing |
| class-validator / class-transformer | Request validation and shaping |
| Joi | Configuration/environment schema validation |
| Helmet | HTTP security headers |
| `@nestjs/throttler` | Rate limiting |
| Swagger (`@nestjs/swagger`) | API documentation generation |
| Pino / nestjs-pino | Structured JSON logging |
| Nodemailer | Outbound email delivery |
| Jest + Supertest | Unit and end-to-end testing |
| tsx | TypeScript execution (used by scripts such as seeding) |

### Frontend
| Technology | Role |
|---|---|
| React + React DOM | UI library |
| TypeScript | Language |
| Vite | Build tool and dev server |
| React Router | Client-side routing |
| Redux Toolkit + React Redux | Global state management |
| Zustand | Additional lightweight client state |
| TanStack Query | Server-state fetching and caching |
| TanStack Table | Data table rendering |
| Axios | HTTP client |
| React Hook Form + Zod + `@hookform/resolvers` | Form handling and schema validation |
| Socket.IO Client | Real-time WebSocket connection to the backend |
| Leaflet, React Leaflet, Leaflet MarkerCluster | Interactive maps |
| Recharts | Charts and analytics |
| Bootstrap + Tailwind CSS (+ `@tailwindcss/vite`) | Styling |
| Font Awesome + React Icons | Icon sets |
| React Hot Toast | Toast notifications |
| React Spinners | Loading indicators |
| clsx + tailwind-merge | Conditional/merged class name utilities |
| dayjs | Date handling |

### Infrastructure
| Technology | Role |
|---|---|
| PostgreSQL 16 (Alpine) | Database container |
| Redis 7 (Alpine) | Cache / queue backend container |
| RabbitMQ 3.12 Management (Alpine) | Message broker container, with management UI |
| pgAdmin | Web-based PostgreSQL administration |
| Docker + Docker Compose | Local orchestration for the full stack, including the backend and frontend as built services |

---
## Role-Based Access Control
Access control is enforced server-side. Four roles exist:
| Role | Capabilities |
|---|---|
| **Admin** | Full platform administration |
| **Shipper** | Create and view own shipments |
| **Carrier** | Update status/location for assigned shipments |
| **Regulator** | Read-only, organization-wide visibility |

---
## Key Technical Decisions
| Area | Decision |
|---|---|
| Backend framework | NestJS on Fastify, structured as modules |
| Real-time updates | Socket.IO, so status changes are pushed rather than polled |
| Background work | BullMQ (backed by Redis) and RabbitMQ for asynchronous/queued processing |
| Token strategy | Separate access and refresh tokens with independent secrets and expirations |
| API docs | Generated from code via `@nestjs/swagger`, rather than hand-maintained |

---
## Docker Environment
`docker-compose.yml` defines six services: `postgres`, `redis`, `rabbitmq`, `pgadmin`, `server`, and `client`. Docker Compose creates an internal network in which these services reach each other by **service name**, not `localhost`.

### Docker Services
**PostgreSQL** (`postgres:16-alpine`, container `escv-postgres`)
Runs on its standard port `5432` inside the Docker network. The host-side port is configurable via `POSTGRES_PORT` (Compose default: `5433`), so the mapping is `host:POSTGRES_PORT -> container:5432`. Other containers reach it at `postgres:5432`.

**Redis** (`redis:7-alpine`, container `escv-redis`)
Reachable from other services at `redis:6379`. The host-side port is configurable via `REDIS_PORT`. The backend's Redis-related tooling (`ioredis`, `BullMQ`) connects through this service.

**RabbitMQ** (`rabbitmq:3.12-management-alpine`, container `escv-rabbitmq`)
Exposes `5672` for AMQP and `15672` for the management UI inside the network. Host-side ports are configurable via `RABBITMQ_AMQP_PORT` and `RABBITMQ_MANAGEMENT_PORT`. The backend connects internally at `rabbitmq:5672`.

**pgAdmin** (`dpage/pgadmin4:latest`, container `escv-pgadmin`)
A web UI for administering PostgreSQL. The container listens on port `80` internally; the host-side port is configurable via `PGADMIN_PORT`. Compose starts pgAdmin only after PostgreSQL reports healthy.

**Server** (built from `./server/Dockerfile`, container `escv-server`)
The NestJS backend, listening on `8081`. Docker Compose supplies its configuration through environment variables (see [Environment Variables](#environment-variables)).

**Client** (built from `./client/Dockerfile`, container `escv-client`)
The built frontend, served from the container on port `80`, mapped to host port `5173`. This is a **built** artifact served by the container — it is not the Vite development server (that only runs during local `npm run dev`).

### Service Networking
Inside the Docker network, services address each other by name and internal port:
```bash
server -> postgres:5432
server -> redis:6379
server -> rabbitmq:5672
```

From the host machine (your browser or terminal), you instead use `localhost` with the **host-mapped** ports. Note that `localhost` means something different depending on where a process runs: inside the `server` container, `localhost` refers to the server container itself — not PostgreSQL, Redis, or RabbitMQ.

### Exposed Ports
| Service | Container Port | Host Port (via) |
|---|---|---|
| PostgreSQL | 5432 | `POSTGRES_PORT` (default `5433`) |
| Redis | 6379 | `REDIS_PORT` |
| RabbitMQ (AMQP) | 5672 | `RABBITMQ_AMQP_PORT` |
| RabbitMQ (Management UI) | 15672 | `RABBITMQ_MANAGEMENT_PORT` |
| pgAdmin | 80 | `PGADMIN_PORT` |
| Server (backend) | 8081 | 8081 |
| Client (frontend) | 80 | 5173 |

### Persistent Volumes
Data survives container restarts through named volumes: `postgres_data`, `redis_data`, `rabbitmq_data`, and `pgadmin_data`.

### Health Checks
- PostgreSQL: `pg_isready`
- Redis: `redis-cli ping`
- RabbitMQ: `rabbitmq-diagnostics ping`

The backend's `depends_on` configuration waits for PostgreSQL, Redis, and RabbitMQ to report healthy before starting, and the client service depends on the server.

---
## Environment Variables
Three `.env` files are relevant, and each has a distinct role. None are committed — only `.example` templates are tracked.

```js
Root
├── .env
├── server/.env
└── client/.env
```

### Root Environment File
Read by **Docker Compose**. It provides infrastructure credentials/ports and the application secrets Compose injects into the `server` container:

```bash
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=escv_db
POSTGRES_PORT=5433

# Redis
REDIS_PORT=6379

# RabbitMQ
RABBITMQ_USER=guest
RABBITMQ_PASS=guest
RABBITMQ_AMQP_PORT=5672
RABBITMQ_MANAGEMENT_PORT=15672

# pgAdmin
PGADMIN_EMAIL=admin@escv.com
PGADMIN_PASSWORD=admin
PGADMIN_PORT=5050

# Backend application secrets (injected into the server container by Compose)
JWT_ACCESS_SECRET=
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRATION=7d
COOKIE_SECRET=
CORS_ORIGIN=http://localhost:5173
BCRYPT_SALT_ROUNDS=12
PASSWORD_RESET_TOKEN_TTL_MINUTES=15
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=mail@example.com
MAIL_PASS=your-api-key
MAIL_FROM="ESCV <noreply@escv.com>"
```

Generate secure secret values with:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Compose derives `NODE_ENV`, `PORT`, `DATABASE_URL`, `REDIS_HOST`, and `RABBITMQ_URL` for the `server` container using the Docker service names (`postgres`, `redis`, `rabbitmq`) — these do not need to be set manually when running under Docker.

### Server Environment Variables
`server/.env` is used only when running the backend **directly on the host**, outside Docker (see [Running the Backend Manually](#running-the-backend-manually)). It mirrors the same variable names as the root file, but with host-appropriate connection values, since PostgreSQL, Redis, and RabbitMQ are reached through their **host-mapped** ports rather than their Docker service names:

```bash
NODE_ENV=development
PORT=8081
COOKIE_SECRET=
CORS_ORIGIN=http://localhost:5173
BCRYPT_SALT_ROUNDS=12
PASSWORD_RESET_TOKEN_TTL_MINUTES=15

DATABASE_URL="postgresql://postgres:postgres@localhost:5433/escv_db"

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
MAIL_USER=mail@example.com
MAIL_PASS=your-api-key
MAIL_FROM="ESCV <noreply@escv.com>"
FRONTEND_URL=http://localhost:5173
```

### Client Environment Variables
`client/.env` holds only the frontend's own configuration:

```bash
VITE_API_BASE_URL=
```

Any variable prefixed `VITE_` is exposed to the browser at build time. Never put server secrets in this file.

### Docker vs Local Development
| Context | PostgreSQL | Redis | RabbitMQ |
|---|---|---|---|
| Inside Docker (server container) | `postgres:5432` | `redis:6379` | `rabbitmq:5672` |
| On the host (manual `npm run start:dev`) | `localhost:<POSTGRES_PORT>` | `localhost:<REDIS_PORT>` | `localhost:<RABBITMQ_AMQP_PORT>` |

---
## Getting Started
### Prerequisites
| Tool | Notes |
|---|---|
| Node.js | Required for both `client/` and `server/` |
| npm | Package manager used by both applications |
| Docker + Docker Compose | Recommended path — provides PostgreSQL, Redis, RabbitMQ, and pgAdmin |
| Git | To clone the repository |

### Quick Start with Docker
```bash
git clone <repository-url>
cd egypt-supply-chain-visibility

cp .env.example .env
# fill in the values in .env

docker compose up --build
```

Once running:
```
Frontend:  http://localhost:5173
Backend:   http://localhost:8081
```

Stop the stack with:
```bash
docker compose down
```

Rebuild after dependency or Dockerfile changes with:
```bash
docker compose up --build
```

### Running the Backend Manually
Start only the infrastructure containers, then run the backend on the host:
```bash
docker compose up postgres redis rabbitmq -d

cd server
cp .env.example .env
# fill in server/.env, pointing DATABASE_URL / REDIS_HOST / RABBITMQ_URL at localhost

npm install
npm run start:dev
```

### Running the Frontend Manually
```bash
cd client
cp .env.example .env
# fill in client/.env

npm install
npm run dev
```

### Verifying the Application
With both the backend and frontend running, open `http://localhost:5173` in a browser. The frontend's Vite dev server proxies API and WebSocket calls to the backend (see [Important Configuration Notes](#important-configuration-notes)).

---
## Development Workflow
### Server Scripts
| Script | Purpose |
|---|---|
| `npm run build` | Compile the NestJS application |
| `npm run start` | Run the compiled application |
| `npm run start:dev` | Run in watch mode for local development |
| `npm run start:debug` | Run in watch mode with the debugger attached |
| `npm run start:prod` | Run the production build |
| `npm run lint` | Lint the codebase |
| `npm run test` | Run unit tests (Jest) |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run test:cov` | Run unit tests with coverage |
| `npm run test:debug` | Run unit tests with the debugger attached |
| `npm run test:e2e` | Run end-to-end tests (Supertest) |
| `npm run seed` / `npm run seed:run` | Seed the database |

Prisma itself is used directly for schema/migration commands, e.g. `npx prisma db seed`.

### Client Scripts
| Script | Purpose |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Produce a production build |
| `npm run lint` | Lint the codebase |
| `npm run preview` | Preview the production build locally |

---
## API Documentation
The backend has `@nestjs/swagger` installed for generating API documentation from code. The exact path the documentation is served on is defined in the server's bootstrap configuration — check `server/README.md` or the server source for the current URL.

Detailed endpoint-level documentation (routes, request/response schemas, auth requirements) belongs in the generated Swagger output and the server's own README, rather than being duplicated here.

---
## Project Documentation
| Document | Location | Contents |
|---|---|---|
| Server | `server/README.md` | NestJS setup, API details, module documentation |
| Client | `client/README.md` | React setup, project structure, state management |
| Database | `database/README.md` | Schema design, ERD, naming conventions |

Additional implementation details are documented in the corresponding service README.

---
## Important Configuration Notes
- **`localhost` is context-dependent.** Inside the `server` container, `localhost` refers to the server container itself — not `postgres`, `redis`, or `rabbitmq`. Use Docker service names for inter-container communication, and host-mapped ports (e.g. `localhost:5433` for PostgreSQL) only from the host machine.
- **`POSTGRES_PORT` defaults to `5433`** on the host side, while PostgreSQL always listens on `5432` inside the container.
- **The Vite dev proxy is a development-only convenience.** In `vite.config.ts`, the paths `/api` and `/socket.io` are proxied to `http://localhost:8081` so the frontend dev server and backend can run on different ports without CORS friction:

```bash
Browser -> /api          -> Vite dev server -> NestJS backend :8081
Browser -> /socket.io    -> Vite dev server -> NestJS Socket.IO :8081
```

The Dockerized frontend serves a production build from its own container on port 80 — it does not use this dev proxy.
- **Root `.env` vs `server/.env` are not redundant.** They express the same configuration for two different execution contexts: containers on the Docker network, versus a process running directly on the host.

---
## License
**PROPRIETARY LICENSE**
© 2026 Egypt Supply Chain Visibility Team. All Rights Reserved.

This project is a university capstone project. This software and associated documentation are proprietary and confidential. No part may be reproduced, distributed, or transmitted in any form without prior written permission from the authors.

---
<div align="center">
  <strong>Bringing visibility to Egypt's supply chains.</strong>
</div>