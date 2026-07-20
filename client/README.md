# Egypt Supply Chain Visibility (ESCV) — Client

> React frontend for the Egypt Supply Chain Visibility Platform.

<div align="center">
  <img src="../docs/assets/escv-logo.png" alt="ESCV Logo" width="800" />
</div>

---
## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Setup](#environment-setup)
- [Installation](#installation)
- [Running the Client](#running-the-client)
- [Architecture](#architecture)
  - [Three Rules](#three-rules)
  - [Data Flow](#data-flow)
  - [Role-Based Views](#role-based-views)
- [Features Roadmap](#features-roadmap)
- [API Integration](#api-integration)
- [Real-Time Integration](#real-time-integration)
- [Routing](#routing)
- [State Management](#state-management)
- [Development Workflow](#development-workflow)
- [License](#license)

---
## Overview
The ESCV client is a **React + TypeScript** single-page application that gives shippers, carriers, regulators, and administrators a unified view of Egypt's national supply chain in real time.

It connects to the ESCV NestJS backend via a versioned REST API and a Socket.IO WebSocket gateway. Every role sees a different dashboard tailored to their responsibilities — a shipper tracks their own cargo, a carrier updates shipment status and pushes GPS coordinates, a regulator monitors national port load, and an admin manages the platform.

**Status:** Project scaffolded. Feature development has not started yet.

**What's set up:**
- Vite + React + TypeScript project initialized
- Folder structure defined and created
- Tailwind CSS configured
- ESLint configured
- Ready for feature development

---
## Prerequisites
| Tool | Version | Purpose | Install |
|---|---|---|---|
| **Node.js** | 20.x LTS | JavaScript runtime | [nodejs.org](https://nodejs.org) |
| **npm** | 10.x | Package manager | Included with Node |
| **Git** | Latest | Version control | [git-scm.com](https://git-scm.com) |
| **VS Code** | Latest | Editor | [code.visualstudio.com](https://code.visualstudio.com) |

**Recommended VS Code extensions:**
```js
ESLint
Prettier
Tailwind CSS IntelliSense
ES7+ React/Redux/React-Native snippets
Auto Rename Tag
GitLens
DotENV
```

---
## Tech Stack
| Technology | Purpose | Version |
|---|---|---|
| ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) | UI Library | 18.x |
| ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) | Language | 5.x |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white) | Styling | 3.x |
| ![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white) | Client-side Routing | 6.x |
| ![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white) | Server State & Caching | 5.x |
| ![Zustand](https://img.shields.io/badge/Zustand-433E38?style=for-the-badge&logoColor=white) | Global Client State | 4.x |
| ![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white) | HTTP Client | 1.x |
| ![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white) | Real-time WebSocket | 4.x |
| ![Mapbox](https://img.shields.io/badge/Mapbox-000000?style=for-the-badge&logo=mapbox&logoColor=white) | Live Map Rendering | 3.x |
| ![Recharts](https://img.shields.io/badge/Recharts-22B5BF?style=for-the-badge&logoColor=white) | Charts & Analytics | 2.x |
| ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white) | Build Tool | 5.x |

---
## Project Structure
```js
client/
│
├── public/
│   └── escv-logo.png
│
├── src/
│   │
│   ├── api/                          # All HTTP calls — one file per server module
│   │   ├── client.ts                 # Axios instance, interceptors, token injection
│   │   ├── auth.api.ts
│   │   ├── shipments.api.ts
│   │   ├── organizations.api.ts
│   │   ├── alerts.api.ts
│   │   ├── dashboard.api.ts
│   │   ├── reports.api.ts
│   │   └── admin.api.ts
│   │
│   ├── features/                     # One folder per business domain
│   │   │
│   │   ├── auth/                     # Login, register pages and forms
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── hooks/
│   │   │
│   │   ├── shipments/                # Shipment list, detail, create
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── hooks/
│   │   │
│   │   ├── tracking/                 # Live map, shipment timeline
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── hooks/
│   │   │
│   │   ├── dashboard/                # Role-specific dashboards and KPI panels
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── hooks/
│   │   │
│   │   ├── alerts/                   # Alert feed and notification state
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   │
│   │   ├── organizations/            # Organization list, detail, member directory
│   │   │   ├── components/
│   │   │   └── pages/
│   │   │
│   │   ├── reports/                  # Report request and status tracking
│   │   │   ├── components/
│   │   │   └── pages/
│   │   │
│   │   └── admin/                    # Admin platform management views
│   │       ├── components/
│   │       └── pages/
│   │
│   ├── components/                   # Shared UI — zero business logic
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── Table.tsx
│   │   │   └── Toast.tsx
│   │   └── layout/                   # AppLayout, Sidebar, Topbar, PageHeader
│   │
│   ├── store/                        # Zustand — global client state only
│   │   ├── auth.store.ts             # Current user, tokens, isAuthenticated
│   │   └── socket.store.ts           # Socket connection status, live events
│   │
│   ├── hooks/                        # Hooks shared across multiple features
│   │   ├── useSocket.ts              # Socket.IO connection and room management
│   │   └── usePageTitle.ts
│   │
│   ├── router/                       # All routes in one place
│   │   ├── index.tsx
│   │   ├── ProtectedRoute.tsx        # Redirects to /login if unauthenticated
│   │   └── RoleRoute.tsx             # Redirects if role doesn't match
│   │
│   ├── types/                        # TypeScript interfaces matching server responses
│   │   ├── auth.types.ts
│   │   ├── shipment.types.ts
│   │   ├── organization.types.ts
│   │   ├── alert.types.ts
│   │   └── user.types.ts
│   │
│   ├── constants/
│   │   ├── routes.ts                 # Route path strings — no magic strings in JSX
│   │   └── shipment.constants.ts     # Status labels, badge color mappings
│   │
│   ├── utils/
│   │   ├── date.ts                   # dayjs formatters
│   │   └── token.ts                  # localStorage get/set/clear helpers
│   │
│   ├── config/
│   │   └── env.ts                    # import.meta.env wrappers with types
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── .env
├── .env.example
├── .gitignore
├── eslint.config.js
├── index.html
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
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
```bash
# ── API ────────────────────────────────────────────────
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_WS_URL=http://localhost:3000

# ── Map ────────────────────────────────────────────────
VITE_MAPBOX_TOKEN=your_mapbox_public_token_here
```

> All client environment variables must be prefixed with `VITE_` — Vite only exposes variables with this prefix to the browser. Never put secrets in client environment variables.

---
## Installation
### Step 1 — Scaffold the project
```bash
npm create vite@latest client -- --template react-ts
cd client
npm install
```

### Step 2 — Install all dependencies
```bash
# Routing
npm install react-router-dom

# Server state and caching
npm install @tanstack/react-query

# Global client state
npm install zustand

# HTTP client
npm install axios

# Real-time
npm install socket.io-client

# Map
npm install mapbox-gl
npm install -D @types/mapbox-gl

# Charts
npm install recharts

# Styling utilities
npm install clsx tailwind-merge

# Date handling
npm install dayjs

# Form validation
npm install react-hook-form zod @hookform/resolvers

# Toast notifications
npm install react-hot-toast

# Icons
npm install lucide-react
```

### Step 3 — Configure Tailwind

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Add to `tailwind.config.ts`:

```typescript
content: ["./index.html", "./src/**/*.{ts,tsx}"]
```

Add to `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---
## Running the Client
```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Type check
npm run tsc --noEmit
```

The client runs on `http://localhost:5173` by default.

> The server must be running on `http://localhost:3000` for API calls to work.

---
## Architecture
### Three Rules
These three rules apply to every developer on every feature. They are non-negotiable.

**Rule 1 — No axios calls in components or pages.**
Components call hooks. Hooks call the api layer. The api layer calls axios. Never skip a layer. A component that imports axios directly is a bug.

**Rule 2 — No server data in Zustand.**
TanStack Query owns all server state — caching, background refetching, loading and error states. Zustand owns only client state that has nothing to do with the server: the auth session and the socket connection status.

**Rule 3 — Feature-first, not type-first.**
A `ShipmentCard` belongs in `features/shipments/components/`, not in the shared `components/` folder. Only UI elements used in three or more unrelated features earn a place in the shared `components/` folder.

---
### Data Flow
```js
User interaction
      │
      ▼
Page component
      │
      ▼
Feature hook (useShipments, useDashboard...)
      │
      ├── TanStack Query     manages server state, caching, loading/error
      │         │
      │         ▼
      │     api layer        shipments.api.ts → axios client → server
      │
      └── Zustand store      reads auth session, socket status (client state only)
```

---
### Role-Based Views
The server enforces role restrictions on every endpoint. The client reflects those roles in routing and UI — each role lands on a different dashboard and sees only the navigation relevant to their work.

| Role | Landing Page | Key Features |
|---|---|---|
| **Shipper** | Shipper Dashboard | Own shipments, create shipment, alerts |
| **Carrier** | Carrier Dashboard | Assigned shipments, update status, push GPS |
| **Regulator** | Regulator Dashboard | National overview, port load, all shipments read-only |
| **Admin** | Admin Dashboard | All of the above + user and organization management |

`RoleRoute` in the router enforces this — a shipper navigating to `/admin` is redirected. This mirrors the `RolesGuard` on the server.

---
## Features Roadmap
The features below map directly to server modules. They will be built in this order — each one depends on auth being complete first.

| # | Feature | Server Module | Status |
|---|---|---|---|
| 1 | Authentication — login, register, token handling | `AuthModule` | Not started |
| 2 | Layout shell — sidebar, topbar, protected routes | — | Not started |
| 3 | Shipments — list, detail, create, status update | `ShipmentsModule` | Not started |
| 4 | Tracking — live map, shipment timeline | `ShipmentsModule` | Not started |
| 5 | Dashboard — role-specific KPIs and charts | `DashboardModule` | Not started |
| 6 | Alerts — alert feed, unread count, mark read | `AlertsModule` | Not started |
| 7 | Organizations — list, detail, member directory | `OrganizationsModule` | Not started |
| 8 | Reports — request generation, poll status | `ReportsModule` | Not started |
| 9 | Admin — user and org management | `AdminModule` | Not started |
| 10 | Real-time — WebSocket events, live updates | `NotificationsModule` | Not started |

---
## API Integration
All server communication goes through `src/api/`. The Axios instance in `client.ts` handles base URL, auth header injection, and 401 responses automatically.

```typescript
// src/api/client.ts — single Axios instance for the entire app
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Inject access token on every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

Each domain gets its own api file that imports `apiClient`:

```typescript
// src/api/shipments.api.ts
import apiClient from './client';
import type { Shipment } from '@/types/shipment.types';

export const shipmentsApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<{ data: Shipment[] }>('/shipments', { params }),

  getById: (id: string) =>
    apiClient.get<{ data: Shipment }>(`/shipments/${id}`),

  create: (body: CreateShipmentDto) =>
    apiClient.post<{ data: Shipment }>('/shipments', body),

  updateStatus: (id: string, body: UpdateStatusDto) =>
    apiClient.patch(`/shipments/${id}/status`, body),
};
```

Feature hooks then wrap these calls with TanStack Query:

```typescript
// src/features/shipments/hooks/useShipments.ts
import { useQuery } from '@tanstack/react-query';
import { shipmentsApi } from '@/api/shipments.api';

export const useShipments = (filters?: ShipmentFilters) => {
  return useQuery({
    queryKey: ['shipments', filters],
    queryFn: () => shipmentsApi.getAll(filters),
  });
};
```

---
## Real-Time Integration

The `useSocket` hook in `src/hooks/useSocket.ts` manages the Socket.IO connection lifecycle. It connects once when the user authenticates, joins rooms based on what the current page needs, and distributes events to the relevant feature hooks.

**Server WebSocket events the client handles:**
| Event | Where it's used |
|---|---|
| `shipment:updated` | Tracking map — update marker position and status |
| `alert:new` | Alert feed — append new alert, increment unread badge |
| `dashboard:stats` | Dashboard KPI panels — update counts without page refresh |
| `report:ready` | Reports page — update report status to completed |

---
## Routing
All routes are defined in `src/router/index.tsx`. Route path strings live in `src/constants/routes.ts` — no magic strings in JSX.

```typescript
// src/constants/routes.ts
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  SHIPMENTS: '/shipments',
  SHIPMENT_DETAIL: '/shipments/:id',
  TRACKING: '/tracking',
  ALERTS: '/alerts',
  ORGANIZATIONS: '/organizations',
  REPORTS: '/reports',
  ADMIN: '/admin',
} as const;
```

**Route guards:**
`ProtectedRoute` — wraps all authenticated routes. Reads the Zustand auth store. If there is no valid session, redirects to `/login`.

`RoleRoute` — wraps role-specific routes. Takes a `roles` prop. If the current user's role is not in the list, redirects to their own dashboard.

---
## State Management
**Zustand** handles two stores and nothing else.
`auth.store.ts` — the currently authenticated user, their role, and whether they are logged in. This persists across page refreshes using `localStorage`.

`socket.store.ts` — the Socket.IO connection instance and its status. Shared so any component can check if the socket is connected without prop drilling.

**TanStack Query** handles everything else — shipment lists, dashboard stats, alert feeds, organization data. It caches responses, refetches in the background, and gives every component accurate loading and error states out of the box.

---
## Development Workflow
### Building a Feature — Step by Step
```js
1.  Start with the types — add the interface to src/types/
2.  Add the api calls to src/api/feature.api.ts
3.  Create the feature folder under src/features/feature-name/
4.  Write the hook — wrap the api call with useQuery or useMutation
5.  Build the page component — it calls the hook, not the api directly
6.  Build smaller components inside features/feature-name/components/
7.  Register the route in src/router/index.tsx
8.  Add the route constant to src/constants/routes.ts
9.  Add the nav link in the Sidebar if needed
```

### Git Workflow
```bash
# Never commit directly to main
git checkout -b feat/feature-name

git add .
git commit -m "feat(feature): description of what was added"
git push origin feat/feature-name

# Open a pull request for review before merging
```

**Commit message format:**
```js
feat(scope):     new page, component, or feature
fix(scope):      bug fix
refactor(scope): internal change, no behavior change
style(scope):    UI or styling change only
docs:            documentation update
chore:           dependencies, config, build
```

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