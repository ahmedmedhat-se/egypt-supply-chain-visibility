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
- [Running the Client](#running-the-client)
- [Architecture](#architecture)
- [Implemented Features](#implemented-features)
- [Routing and Guards](#routing-and-guards)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [Real-Time Integration](#real-time-integration)
- [Development Workflow](#development-workflow)
- [License](#license)

---

## Overview

The ESCV client is a **React 19 + TypeScript** single-page application giving shippers, carriers, regulators, org admins, and platform super admins a real-time view of Egypt's supply chain. It talks to the NestJS backend through the `/api` REST surface and a Socket.IO gateway.

**Current status:** All core modules are implemented — authentication, role-based dashboards, shipments, live tracking map, alerts, organizations/invitations, reports, audit logs, and admin panels.

**What's working today:**

- Full authentication flow — login, registration, forgot/reset password, accept invitation
- Access token management with axios interceptors and silent refresh (httpOnly cookie)
- Five role-based route guards — `super_admin`, `admin`, `shipper`, `carrier`, `regulator`
- Role-specific dashboards and shipment views
- Live Leaflet map with shipment markers and OSRM route lines
- Dark/light mode, responsive layout shell (sidebar, topbar, mobile menu)
- Server state via TanStack Query; client state via Zustand
- Real-time Socket.IO feed (`shipment:updated`, `alert:new`, `force_logout`)

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 20.x LTS | JavaScript runtime |
| npm | 10.x | Package manager |

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19.x | UI library |
| TypeScript | 6.x | Language |
| Vite | 8.x | Build tool and dev server |
| React Router | 7.x | Client-side routing |
| TanStack Query | 5.x | Server state, caching |
| Zustand | 5.x | Client state (auth, theme, live feed) |
| Axios | 1.x | HTTP client |
| Socket.IO Client | 4.x | Real-time WebSocket |
| Leaflet + React Leaflet + MarkerCluster | 1.9 / 5.x / 1.5 | Live maps |
| Tailwind CSS | 4.x | Styling (`@tailwindcss/vite`) |
| React Hook Form | 7.x | Forms |
| Zod | 4.x | Schema validation |
| React Icons (Font Awesome set) | 5.x | Icons |
| React Hot Toast | 2.x | Notifications |
| clsx + tailwind-merge | — | `cn()` class merging |

## Project Structure

```text
client/
├── public/escv-logo.png
├── src/
│   ├── api/                       # All HTTP calls — one file per server module
│   │   ├── client.ts              # Axios instance · token injection · silent refresh
│   │   ├── auth.api.ts            # login, register, refresh, forgot/reset password
│   │   ├── shipments.api.ts       # shipments + status/route/accept
│   │   ├── alerts.api.ts          # alerts · unread count · read-all
│   │   ├── dashboard.api.ts       # dashboard stats
│   │   ├── organization.api.ts    # members · invitations · org audit logs
│   │   ├── admin.api.ts           # super-admin: users · orgs · shipments · bulk
│   │   ├── reports.api.ts         # reports + download
│   │   ├── routes.api.ts          # routes + checkpoints
│   │   ├── checkpoints.api.ts     # checkpoints
│   │   └── map.api.ts             # OSRM route
│   │
│   ├── components/
│   │   ├── ui/                    # Shared primitives — Button, Card, Input, Badge,
│   │   │                          # Modal, Table, Avatar, LoadingSpinner, Toast,
│   │   │                          # Select, Tabs, Pagination, EmptyState,
│   │   │                          # ErrorBoundary, ThemeToggle, MapPicker
│   │   ├── layout/                # AppLayout, Sidebar, Topbar, Footer
│   │   ├── auth/                  # Login/Register/Forgot/Reset forms + strength meter
│   │   ├── shipments/             # Create/Edit/Detail modals, RoutePicker
│   │   ├── map/                   # LiveMap (markers + OSRM route lines)
│   │   ├── live/                  # LiveSocketBridge, LiveIndicator
│   │   ├── invitations/           # Invitation-related UI
│   │   └── pages/                 # Route pages, incl. role-scoped folders:
│   │       ├── org-admin/         # Admin dashboard
│   │       ├── super-admin/       # Users, Organizations, Invitations, Routes,
│   │       │                      # Checkpoints, Audit Logs
│   │       ├── shipper/           # Shipper dashboard
│   │       ├── carrier/           # Carrier dashboard + shipments
│   │       └── regulator/         # Regulator dashboard
│   │
│   ├── constants/                 # routes.ts · shipments.ts (statuses/transitions) · audit.ts
│   ├── hooks/                     # useAuth, useShipments, useCheckpoints, useRoutes,
│   │                              # useSessions, useAuditLogs, useTheme, useGeolocation
│   ├── lib/utils.ts               # cn() · formatDate()
│   ├── router/                    # index.tsx (lazy routes) · ProtectedRoute · RoleRoute
│   ├── services/socket.ts         # Socket.IO connection lifecycle (auth, reconnect)
│   ├── store/                     # auth.store.ts · theme.store.ts · live.store.ts
│   ├── types/                     # auth, admin, shipment, organization, checkpoint,
│   │                              # route, session, invitation, pagination, contact
│   ├── App.tsx                    # Router + QueryClient + Toaster + LiveSocketBridge
│   ├── main.tsx
│   └── index.css                  # @import "tailwindcss"
├── .env.example                   # VITE_API_BASE_URL=
├── nginx.conf                     # production proxy (Docker)
└── vite.config.ts                 # dev proxy: /api and /socket.io -> localhost:8081
```

## Environment Setup

```bash
cp .env.example .env
```

```env
# Empty = same-origin (Vite dev proxy / nginx).
# Or set the backend directly, e.g. http://localhost:8081
VITE_API_BASE_URL=
```

Only `VITE_`-prefixed variables reach the browser — never put secrets here.

## Running the Client

```bash
npm install
npm run dev          # http://localhost:5173 (proxies /api and /socket.io to :8081)
npm run build        # tsc -b && vite build
npm run preview      # serve the production build locally
npm run lint
```

In Docker, the built SPA is served by nginx on port 80 (host `5173`), which proxies `/api` and `/socket.io` to the `server` container.

## Architecture

**Three rules** (not suggestions):

1. **No axios in components.** Components call hooks → hooks call the api layer → the api layer calls axios (`src/api/client.ts`). A component importing axios directly is a bug.
2. **No server data in Zustand.** TanStack Query owns all server state (fetching, caching, retries, loading/error states). Zustand holds only client state: the auth session (`auth.store.ts`), the theme (`theme.store.ts`), and the live socket feed (`live.store.ts`).
3. **Feature UI stays in its domain folder.** Shipment UI lives in `components/shipments/`, map UI in `components/map/`, pages in `components/pages/<role>/`. Only primitives reused across three or more areas earn a place in `components/ui/`.

**Data flow:**

```text
User interaction
      │
      ▼
Page component (components/pages)
      │
      ▼
Feature hook (hooks/useShipments, useAlerts, …)
      │
      ├── TanStack Query  fetches · caches · manages loading/error state
      │         │
      │         ▼
      │     api layer (api/shipments.api.ts → axios → ESCV server)
      │
      └── Zustand stores  auth session · theme · live feed (client state only)
```

## Implemented Features

### Authentication

`src/components/auth/` + `src/hooks/useAuth.ts`:

- **Login** — email/password with React Hook Form + Zod. On success the access token is stored and the user is redirected to their role dashboard.
- **Register** — creates an organization; the account is created as its **admin** (org type does not map to the account role). Password strength indicator included.
- **Forgot / Reset password** — emails a single-use link; reset revokes all other sessions.
- **Accept invitation** — validates the token, creates the account with the invited role.
- **Token management** — the axios client injects `Bearer <token>` on every request; a response interceptor silently refreshes via the httpOnly refresh cookie (queueing concurrent 401s) and redirects to `/login` on failure.

### Role-Based Views

| Role | Landing Page | Scope |
|---|---|---|
| **super_admin** | `/super-admin/dashboard` | Platform: users, organizations, routes, checkpoints, invitations, audit logs, all shipments |
| **admin** | `/admin/dashboard` | Org: members, invitations, org audit logs, shipments |
| **shipper** | `/shipper/dashboard` | Own shipments, create shipment, tracking |
| **carrier** | `/carrier/dashboard` | Claim/update assigned shipments, route guidance |
| **regulator** | `/regulator/dashboard` | Read-only organizational visibility |

### Pages

| Page | Route | Notes |
|---|---|---|
| Home / About / Contact / Terms / Privacy | `/`, `/about`, … | Public marketing/static pages |
| Login / Register / Forgot Password / Reset Password | `/login`, … | Public auth pages |
| Accept Invitation | `/accept-invitation` | Full-screen public page |
| Dashboards | `/admin/dashboard`, `/super-admin/dashboard`, `/shipper/dashboard`, `/carrier/dashboard`, `/regulator/dashboard` | Role-scoped KPI panels |
| Shipments | `/admin/shipments`, `/shipper/shipments`, `/carrier/shipments`, `/regulator/shipments`, `/super-admin/shipments`, `/shipments/:id` | List, detail with timeline, create/edit/status/route modals |
| Tracking | `/tracking` | Live Leaflet map with markers + OSRM routes |
| Alerts | `/alerts` | Alert feed with unread badge |
| Reports | `/reports` | Generate and poll reports |
| Org Admin | `/users-report`, `/invitations`, `/audit-logs` | Members, invitations, org audit trail |
| Super Admin | `/super-admin/users-report`, `/super-admin/organizations`, `/super-admin/invitations`, `/super-admin/routes`, `/super-admin/checkpoints`, `/super-admin/audit-logs` | Platform management |
| Profile | `/profile` | Update profile + password |
| Not Found | `*` | 404 with navigation |

## Routing and Guards

All routes are defined in `src/router/index.tsx` and lazy-loaded. Path strings live in `src/constants/routes.ts` — no raw literals in JSX.

- **`ProtectedRoute`** — redirects unauthenticated users to `/login` (preserving the intended destination).
- **`RoleRoute`** — takes a `roles` prop and redirects mismatched roles to their own dashboard. The client mirrors the server's `RolesGuard`; real enforcement is always server-side.
- `/dashboard` and `/shipments` are role-aware redirectors.

## State Management

- **TanStack Query** — configured in `App.tsx` with `staleTime: 5 min`, `gcTime: 10 min`, one retry, no refetch on window focus. All server data flows through `useQuery` / `useMutation`.
- **Zustand** — three stores, two persisted to localStorage: `auth.store` (user, token, authenticated flag) and `theme.store` (light/dark, hardened against stale values). `live.store` (socket connected flag + recent live events) is in-memory only.

## API Integration

All server communication is centralized in `src/api/`. No component imports axios directly.

```typescript
// reads
const { data, isLoading } = useQuery({
  queryKey: ['shipments', filters],
  queryFn: () => shipmentsApi.getAll(filters),
});

// writes
const mutation = useMutation({
  mutationFn: shipmentsApi.create,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shipments'] }),
});
```

## Real-Time Integration

`src/services/socket.ts` owns the Socket.IO connection: it connects with the current access token via the handshake `auth` callback (so every reconnect presents a fresh token), refreshes the token on `auth_required`, and force-logs-out on `force_logout`. `LiveSocketBridge` connects when authenticated; `live.store` tracks connectivity and the recent event feed.

| Event | Direction | Purpose |
|---|---|---|
| `join_page` / `leave_page` | client → server | Join/leave a page-scoped room |
| `shipment:updated` | server → client | Live status/location updates (permission-filtered server-side) |
| `alert:new` | server → client | New alert for this user |
| `auth_required` | server → client | Token invalid — refresh and reconnect |
| `force_logout` | server → client | Session revoked — clear auth, redirect to login |

## Development Workflow

```text
1. Add TypeScript interfaces to src/types/
2. Add API calls to src/api/<feature>.api.ts
3. Build the hook (useQuery / useMutation) in src/hooks/
4. Build the page in components/pages/ and sub-components in its domain folder
5. Register the route in src/router/index.tsx and src/constants/routes.ts
6. Add the nav link to the Sidebar if needed
7. Update this README
```

**Git workflow:** branch per feature (`feat/feature-name`), pull request, review before merging. Commit format: `feat(scope):`, `fix(scope):`, `refactor(scope):`, `style(scope):`, `docs:`, `chore:`.

## License

**PROPRIETARY LICENSE** — © 2026 Egypt Supply Chain Visibility Team. All Rights Reserved.

This project is a university capstone project developed to demonstrate full-stack engineering skills applied to a real national infrastructure problem. This software and associated documentation are proprietary and confidential.
