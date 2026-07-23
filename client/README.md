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
- [Implemented Features](#implemented-features)
  - [Authentication System](#authentication-system)
  - [UI Component Library](#ui-component-library)
  - [Pages](#pages)
  - [State Management](#state-management)
  - [API Integration](#api-integration)
  - [Routing and Guards](#routing-and-guards)
  - [Security](#security)
  - [Performance](#performance)
- [Features Roadmap](#features-roadmap)
- [Real-Time Integration](#real-time-integration)
- [Development Workflow](#development-workflow)
- [License](#license)

---
## Overview
The ESCV client is a **React + TypeScript** single-page application that gives shippers, carriers, regulators, and administrators a unified real-time view of Egypt's national supply chain.

It connects to the ESCV NestJS backend via a versioned REST API (`/api`) and a Socket.IO WebSocket gateway. Every role sees a different dashboard tailored to their responsibilities — a shipper tracks their own cargo, a carrier updates shipment status and pushes GPS coordinates, a regulator monitors national port load, and an admin manages the entire platform.

**Current status:** Authentication foundation complete. Feature modules in development.

**What's working today:**
- Complete authentication flow — login, registration, forgot password
- JWT token management with axios interceptors
- Role-based route guards — Admin, Shipper, Carrier, Regulator
- Dark and light mode with persistent Zustand state
- Responsive layout shell — sidebar, topbar, mobile menu
- Custom UI component library
- Form validation with React Hook Form and Zod
- Protected routes with automatic redirect to login
- Rate limiting with account lockout after 5 failed attempts
- TanStack Query configured and ready for feature modules

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
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white) | Styling | 4.x |
| ![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white) | Client-side Routing | 6.x |
| ![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white) | Server State & Caching | 5.x |
| ![Zustand](https://img.shields.io/badge/Zustand-433E38?style=for-the-badge&logoColor=white) | Global Client State | 4.x |
| ![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white) | HTTP Client | 1.x |
| ![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white) | Real-time WebSocket | 4.x |
| ![Mapbox](https://img.shields.io/badge/Mapbox-000000?style=for-the-badge&logo=mapbox&logoColor=white) | Live Map Rendering | 3.x |
| ![Recharts](https://img.shields.io/badge/Recharts-22B5BF?style=for-the-badge&logoColor=white) | Charts & Analytics | 2.x |
| ![React Hook Form](https://img.shields.io/badge/React_Hook_Form-EC5990?style=for-the-badge&logo=reacthookform&logoColor=white) | Form Management | 7.x |
| ![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logoColor=white) | Schema Validation | 3.x |
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
│   │   ├── client.ts                 # Axios instance · interceptors · token injection · 401 handling
│   │   ├── auth.api.ts               # Login, register, refresh, logout, forgot password
│   │   ├── shipments.api.ts
│   │   ├── organizations.api.ts
│   │   ├── alerts.api.ts
│   │   ├── dashboard.api.ts
│   │   ├── reports.api.ts
│   │   └── admin.api.ts
│   │
│   ├── features/                     # One folder per business domain
│   │   │
│   │   ├── auth/                     # Complete
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   └── ForgotPasswordForm.tsx
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── RegisterPage.tsx
│   │   │   │   └── ForgotPasswordPage.tsx
│   │   │   └── hooks/
│   │   │       └── useAuth.ts
│   │   │
│   │   ├── shipments/                # Not started
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── hooks/
│   │   │
│   │   ├── tracking/                 # Not started
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── hooks/
│   │   │
│   │   ├── dashboard/                # Not started
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── hooks/
│   │   │
│   │   ├── alerts/                   # Not started
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   │
│   │   ├── organizations/            # Not started
│   │   │   ├── components/
│   │   │   └── pages/
│   │   │
│   │   ├── reports/                  # Not started
│   │   │   ├── components/
│   │   │   └── pages/
│   │   │
│   │   └── admin/                    # Not started
│   │       ├── components/
│   │       └── pages/
│   │
│   ├── components/                   # Shared UI — zero business logic
│   │   ├── ui/                       # Complete
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── Toast.tsx
│   │   └── layout/                   # Complete
│   │       ├── AppLayout.tsx
│   │       ├── Sidebar.tsx
│   │       ├── Topbar.tsx
│   │       └── PageHeader.tsx
│   │
│   ├── store/                        # Zustand — global client state only
│   │   ├── auth.store.ts             # Complete User · tokens · isAuthenticated · dark mode
│   │   └── socket.store.ts           # Socket connection status
│   │
│   ├── hooks/                        # Hooks shared across multiple features
│   │   ├── useSocket.ts              # Socket.IO connection and room management
│   │   └── usePageTitle.ts
│   │
│   ├── router/                       # All routes in one place
│   │   ├── index.tsx                 # Complete Route definitions with lazy loading
│   │   ├── ProtectedRoute.tsx        # Complete Redirects to /login if unauthenticated
│   │   └── RoleRoute.tsx             # Complete Redirects if role doesn't match
│   │
│   ├── types/                        # TypeScript interfaces matching server responses
│   │   ├── auth.types.ts             # Complete User · tokens · login/register payloads
│   │   ├── shipment.types.ts
│   │   ├── organization.types.ts
│   │   ├── alert.types.ts
│   │   └── user.types.ts
│   │
│   ├── constants/
│   │   ├── routes.ts                 # Complete Route path constants
│   │   └── shipment.constants.ts     # Status labels · badge color mappings
│   │
│   ├── utils/
│   │   ├── cn.ts                     # Complete clsx + tailwind-merge helper
│   │   ├── date.ts                   # dayjs formatters
│   │   └── token.ts                  # Complete localStorage get/set/clear helpers
│   │
│   ├── config/
│   │   └── env.ts                    # Complete import.meta.env wrappers with types
│   │
│   ├── pages/                        # Non-feature pages
│   │   ├── NotFoundPage.tsx          # Complete 404 with navigation options
│   │   ├── AboutPage.tsx             # Complete Mission · vision · feature highlights
│   │   └── ContactPage.tsx           # Complete Contact form with API integration
│   │
│   ├── App.tsx
│   ├── main.tsx                      # Complete QueryClient · RouterProvider · Toaster
│   └── index.css                     # Complete @import "tailwindcss" (v4)
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

> **Legend:** Complete Implemented · Not started
---
## Environment Setup
### Step 1 — Copy the environment template
```bash
cp .env.example .env
```

### Step 2 — Fill in your `.env`
```env
# ── API ────────────────────────────────────────────────
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000

# ── Map ────────────────────────────────────────────────
VITE_MAPBOX_TOKEN=your_mapbox_public_token_here
```

> All client environment variables must be prefixed with `VITE_`. Vite only exposes variables with this prefix to the browser. Never put secrets here.
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

# Map (live tracking)
npm install mapbox-gl
npm install -D @types/mapbox-gl

# Charts
npm install recharts

# Forms and validation
npm install react-hook-form zod @hookform/resolvers

# Styling utilities
npm install clsx tailwind-merge

# Date handling
npm install dayjs

# Notifications
npm install react-hot-toast

# Icons
npm install lucide-react
```

### Step 3 — Tailwind CSS v4 setup

This project uses **Tailwind CSS v4** which requires no config file.

In `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

In `src/index.css` — this single line is the entire Tailwind setup:

```css
@import "tailwindcss";
```

> **Note:** Tailwind v4 dropped `npx tailwindcss init`. There is no config file. Do not run the init command.

### Step 4 — Path aliases

In `tsconfig.app.json`, add:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

Install Node types:

```bash
npm install -D @types/node
```

Now `@/api/client`, `@/store/auth.store`, `@/utils/cn` all resolve from anywhere without relative paths.

---
## Running the Client
```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Type check without building
npx tsc --noEmit
```

The client runs on `http://localhost:5173` by default.

> The server must be running on `http://localhost:3000` for API calls to work.

---
## Architecture
### Three Rules

These three rules apply to every developer on every feature. They are not suggestions.

**Rule 1 — No axios calls in components or pages.**
Components call hooks. Hooks call the api layer. The api layer calls axios. A component that imports axios directly is a bug, not a style choice.

**Rule 2 — No server data in Zustand.**
TanStack Query owns all server state — fetching, caching, background refetching, loading and error states. Zustand owns only two things: the auth session and the socket connection status. Nothing else goes in Zustand.

**Rule 3 — Feature-first, not type-first.**
A `ShipmentCard` belongs in `features/shipments/components/`. It does not belong in the shared `components/` folder. Only UI primitives used across three or more unrelated features earn a place in `components/ui/`.

---
### Data Flow
```js
User interaction
      │
      ▼
Page component
      │
      ▼
Feature hook  (useShipments, useDashboard, useAlerts...)
      │
      ├── TanStack Query    fetches · caches · manages loading and error state
      │         │
      │         ▼
      │     api layer       shipments.api.ts → axios client → ESCV server
      │
      └── Zustand store     auth session · socket status (client state only)
```

---
### Role-Based Views
The server enforces role restrictions on every endpoint. The client mirrors this in routing and navigation — each role lands on a different dashboard and only sees the navigation items relevant to them.

| Role | Landing Page | Navigation Scope |
|---|---|---|
| **Shipper** | Shipper Dashboard | Own shipments · create shipment · alerts |
| **Carrier** | Carrier Dashboard | Assigned shipments · update status · GPS push |
| **Regulator** | Regulator Dashboard | National overview · port load · all shipments read-only |
| **Admin** | Admin Dashboard | Everything above · user management · org management |

`RoleRoute` enforces this at the router level. A shipper hitting `/admin` gets redirected. This mirrors the `RolesGuard` on the server — the restriction exists in both places.

---
## Implemented Features
### Authentication System

**Location:** `src/features/auth/`

The complete authentication flow is built and connected to the server's Auth module endpoints.

**Login page** — email and password form with React Hook Form and Zod validation. Rate limiting is enforced on the client: after 5 consecutive failed attempts the form locks for a cooldown period and shows a clear message. On success, the access token and refresh token are stored via the token utility and the user is redirected to their role-appropriate dashboard.

**Registration page** — collects first name, last name, email, password, phone, and organization type. Organization type maps to the server's role system: Shipper, Carrier, or Regulator. Password strength is evaluated in real time with a visual indicator — the form shows which requirements are met as the user types (minimum 8 characters, uppercase, lowercase, number, special character).

**Forgot password page** — accepts an email address and triggers the server's password reset flow. Displays a confirmation message after submission regardless of whether the email exists, following standard security practice.

**Token management** — the Axios client in `src/api/client.ts` injects the Bearer token on every outbound request via a request interceptor. A response interceptor catches 401 responses, clears localStorage, and redirects to `/login` automatically. Token storage and retrieval is encapsulated in `src/utils/token.ts` — nothing touches localStorage directly outside this utility.

**Password visibility toggle** — all password inputs have a show/hide toggle with proper `aria-label` support for accessibility.

---
### UI Component Library
**Location:** `src/components/ui/`

A set of reusable, typed UI primitives. Every component accepts a `className` prop for extension and uses the `cn()` utility to merge Tailwind classes safely.

| Component | Description |
|---|---|
| `Button` | Primary · secondary · danger · ghost variants with loading state and spinner |
| `Card` | Container with consistent padding, border, and shadow |
| `Input` | Text input with label, error message, and helper text slots |
| `Badge` | Status indicator — default · success · warning · danger · info variants |
| `Modal` | Accessible overlay with backdrop click to close and focus trap |
| `Table` | Structured data display with consistent header and row styling |
| `Avatar` | User avatar with initials fallback when no image is provided |
| `Spinner` | Animated loading indicator — sm · md · lg sizes |
| `Toast` | Notification system via react-hot-toast — success · error · warning · info |

---
### Pages
**Location:** `src/features/auth/pages/` and `src/pages/`

| Page | Route | Status | Description |
|---|---|---|---|
| Login | `/login` | Complete | Email/password · rate limiting · lockout |
| Register | `/register` | Complete | Full registration · org type · password strength |
| Forgot Password | `/forgot-password` | Complete | Email submission · reset flow |
| About | `/about` | Complete | Mission · vision · platform feature highlights |
| Contact | `/contact` | Complete | Contact form with validation and API integration |
| Not Found | `*` | Complete | 404 page with navigation options back to the app |
| Dashboard | `/dashboard` | Not started | Role-specific KPI panels and charts |
| Shipments | `/shipments` | Not started | List · detail · create · status update |
| Tracking | `/tracking` | Not started | Live Mapbox map with shipment markers |
| Alerts | `/alerts` | Not started | Alert feed · unread count · mark read |
| Organizations | `/organizations` | Not started | List · detail · member directory |
| Reports | `/reports` | Not started | Request generation · status polling |
| Admin | `/admin` | Not started | User management · org management |

---
### State Management
**Zustand** manages two stores.

`auth.store.ts` — holds the current user object, their role, and the `isAuthenticated` flag. Also manages the dark/light mode preference. Both auth state and theme preference persist across page refreshes via localStorage. This is the only place in the application that cares about "who is logged in."

`socket.store.ts` — holds the Socket.IO connection instance and its connection status. Any component that needs to know if the socket is connected reads from here instead of receiving it as a prop.

**TanStack Query** manages everything else. It is configured in `main.tsx` with a 60-second stale time and a single retry on failure. Every server data fetch — shipments, alerts, dashboard stats, organizations — goes through `useQuery` or `useMutation`. Loading states, error states, and background refetching are handled automatically.

---
### API Integration
**Location:** `src/api/`

All server communication is centralized. No component or page imports axios directly.

`client.ts` creates a single Axios instance pointed at `VITE_API_BASE_URL`. A request interceptor reads the access token from localStorage and attaches it as a Bearer token on every outbound request. A response interceptor catches 401 responses, clears auth state, and redirects to login.

Each domain has its own api file:

```js
auth.api.ts          → POST /auth/login, /auth/register, /auth/refresh, /auth/logout
shipments.api.ts     → GET/POST/PATCH /shipments and nested routes
organizations.api.ts → GET/POST/PATCH /organizations
alerts.api.ts        → GET/PATCH /alerts
dashboard.api.ts     → GET /dashboard/stats, /dashboard/shipments/map
reports.api.ts       → GET/POST /reports
admin.api.ts         → GET/PUT/DELETE /admin/*
```

Feature hooks wrap these api calls with TanStack Query:

```typescript
// useQuery for reads
const { data, isLoading, error } = useQuery({
  queryKey: ['shipments', filters],
  queryFn: () => shipmentsApi.getAll(filters),
})

// useMutation for writes
const mutation = useMutation({
  mutationFn: shipmentsApi.create,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shipments'] }),
})
```

---
### Routing and Guards
**Location:** `src/router/`

All routes are defined in `router/index.tsx` using React Router v6's `createBrowserRouter`. Every page component is lazy-loaded — the bundle for `/shipments` is not downloaded until the user navigates there.

Route path strings live in `src/constants/routes.ts` as typed constants. No raw strings like `'/shipments'` appear anywhere in JSX or navigation calls.

**`ProtectedRoute`** wraps all authenticated routes. It reads the Zustand auth store. If `isAuthenticated` is false or the token is missing, it redirects to `/login` with the intended destination preserved in location state.

**`RoleRoute`** wraps role-specific routes. It accepts a `roles` prop and compares it against the current user's role from the auth store. A shipper navigating to `/admin` is redirected to their own dashboard.

---
### Security
| Measure | Implementation |
|---|---|
| Password requirements | Minimum 8 characters · uppercase · lowercase · number · special character — enforced by Zod schema |
| Real-time strength feedback | Visual indicator updates as the user types — shows which requirements are met |
| Rate limiting | 5 consecutive failed login attempts triggers a client-side lockout with cooldown timer |
| Token storage | Encapsulated in `utils/token.ts` — nothing touches localStorage directly |
| 401 handling | Axios interceptor clears state and redirects to login automatically |
| Protected routes | All authenticated routes wrapped in `ProtectedRoute` — unauthenticated access redirects to login |
| Admin routes | `RoleRoute` with `roles={['admin']}` — wrong role redirects to own dashboard |
| Input validation | Zod schemas on all forms — malformed data never reaches the API layer |

---
### Performance
| Optimization | How |
|---|---|
| Lazy loading | Every page component uses `React.lazy` — loaded on demand, not upfront |
| Server state caching | TanStack Query caches responses — repeated navigations don't re-fetch |
| Stale time | 60 seconds configured globally — background refetch happens silently |
| Tailwind v4 | Zero-config · smaller output · faster build via Vite plugin |
| Path aliases | `@/` resolves at build time — no runtime overhead |

---
## Features Roadmap

| # | Feature | Server Module | Status |
|---|---|---|---|
| 1 | Authentication — login · register · forgot password | `AuthModule` | Complete |
| 2 | Layout shell — sidebar · topbar · protected routes | — | Complete |
| 3 | UI component library — Button · Card · Input · Badge · Modal · Table | — | Complete |
| 4 | Shipments — list · detail · create · status update | `ShipmentsModule` | Next |
| 5 | Tracking — live Mapbox map · shipment timeline | `ShipmentsModule` | Planned |
| 6 | Dashboard — role-specific KPIs · Recharts | `DashboardModule` | Planned |
| 7 | Alerts — alert feed · unread count · mark read | `AlertsModule` | Planned |
| 8 | Organizations — list · detail · member directory | `OrganizationsModule` | Planned |
| 9 | Reports — request generation · status polling | `ReportsModule` | Planned |
| 10 | Admin — user management · org management | `AdminModule` | Planned |
| 11 | Real-time — WebSocket events · live map updates | `NotificationsModule` | Planned |

---

## Real-Time Integration

The `useSocket` hook in `src/hooks/useSocket.ts` manages the Socket.IO connection. It connects once when the user authenticates using the token from the auth store, joins rooms based on the current page, and distributes incoming events to the relevant feature hooks.

**Server events the client handles:**

| Event | Payload | Where it's consumed |
|---|---|---|
| `shipment:updated` | `{ shipmentId, status, coordinates, timestamp }` | Tracking map — update marker and status |
| `alert:new` | `{ alertId, type, severity, message, shipmentId }` | Alert feed — append alert · increment badge |
| `dashboard:stats` | `{ activeShipments, delayed, portLoad }` | Dashboard KPI panels — update without refresh |
| `report:ready` | `{ reportId, fileUrl }` | Reports page — mark report as completed |

**Client events sent to server:**

| Event | Payload | When |
|---|---|---|
| `join:shipment` | `{ shipmentId }` | On shipment detail page mount |
| `leave:shipment` | `{ shipmentId }` | On shipment detail page unmount |
| `join:dashboard` | `{ role }` | On dashboard page mount |

---

## Development Workflow
### Building a Feature — Step by Step
Every feature follows this exact order. Do not skip steps.
```js
1.  Add TypeScript interfaces to src/types/feature.types.ts
2.  Add API calls to src/api/feature.api.ts
3.  Create the feature folder: src/features/feature-name/
4.  Write the hook — wrap API calls with useQuery or useMutation
5.  Build the page component — calls the hook only, never the API directly
6.  Build sub-components inside features/feature-name/components/
7.  Register the route in src/router/index.tsx
8.  Add the route constant to src/constants/routes.ts
9.  Add the nav link to Sidebar if the feature needs navigation
10. Update this README — mark the feature Complete in the roadmap table
```

### Git Workflow

```bash
# Never commit directly to main
git checkout -b feat/feature-name

git add .
git commit -m "feat(feature): short description of what was added"
git push origin feat/feature-name

# Open a pull request — get it reviewed before merging
```

**Commit message format:**

```js
feat(scope):      new page, component, or feature
fix(scope):       bug fix
refactor(scope):  internal change, no behavior change
style(scope):     UI or styling change only
docs:             documentation update
chore:            dependencies, config, build scripts
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