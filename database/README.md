# Egypt Supply Chain Visibility (ESCV) Database

> PostgreSQL schema for the Egypt Supply Chain Visibility (ESCV) platform.

<div align="center">
  <img src="../docs/assets/escv-logo.png" alt="ESCV Logo" width="800" />
</div>

---

## Table of Contents

- [Overview](#overview)
- [Source of Truth](#source-of-truth)
- [Design Principles](#design-principles)
- [Why PostgreSQL?](#why-postgresql)
- [Naming Conventions](#naming-conventions)
- [Primary Key Strategy](#primary-key-strategy)
- [Roles](#roles)
- [Table Overview](#table-overview)
- [Constraints](#constraints)
- [Indexing Strategy](#indexing-strategy)
- [Audit Trail](#audit-trail)
- [Soft Delete Strategy](#soft-delete-strategy)
- [Security Considerations](#security-considerations)
- [Directory Structure](#directory-structure)
- [License](#license)

---

## Overview

The ESCV database is the central source of truth for the platform, storing organizations, users, shipments, shipment events, routes, checkpoints, alerts, audit logs, reports, and invitations. The schema is a pragmatic, approximately-3NF relational model designed for data integrity, maintainability, and performance.

## Source of Truth

**The runtime schema is owned by Prisma** — `server/prisma/schema.prisma` plus the migrations in `server/prisma/migrations/`. All tables are created and evolved through Prisma migrations.

The `schema.sql` file in this folder is a **legacy design artifact** kept for reference (ERD/design review). It has drifted from the Prisma schema: it still defines a `refresh_token` table (the app now stores sessions in Redis), lacks `shipment.carrier_user_id`, the `invitation` table, and `audit_log.organization_id`, and marks `shipment.created_by_user_id` as NOT NULL (it is nullable in Prisma). **Treat `server/prisma/schema.prisma` as authoritative.**

## Design Principles

- Store business data once; reference it everywhere (no duplication).
- Explicit relationships, consistent naming, readable schemas.
- Practical normalization — approximately Third Normal Form, no over-normalization.
- Data integrity enforced at the database level (PKs, FKs, UNIQUE, CHECK).

## Why PostgreSQL?

Enterprise-grade relational capabilities while staying open source: ACID compliance, advanced indexing, native UUID support, JSONB, strong concurrency, and excellent Prisma integration.

## Naming Conventions

- **Tables** use singular snake_case names mapped from Prisma models: `organization`, `user`, `shipment`, `shipment_event`, `checkpoint`, `route`, `route_checkpoint`, `alert`, `user_alert`, `audit_log`, `report`, `invitation`.
- **Columns** are descriptive and prefixed by their table (`shipment_status`, `checkpoint_name`, `alert_severity`). Generic names like bare `id`, `name`, `status` are avoided.
- **Foreign keys** reference the owning table (`organization_id`, `shipment_id`, `route_id`, `checkpoint_id`).

## Primary Key Strategy

Every table uses a **UUID primary key** — `gen_random_uuid()` (UUID v4) via the `pgcrypto` extension, expressed in Prisma as `@default(dbgenerated("gen_random_uuid()")) @db.Uuid`.

UUIDs are globally unique, safe for distributed systems, and avoid enumerable sequential IDs.

## Roles

The `user.user_role` column is constrained by a CHECK to five roles:

```sql
CHECK (user_role IN ('super_admin', 'admin', 'shipper', 'carrier', 'regulator'))
```

Organization types follow a similar pattern: `shipper`, `carrier`, `regulator`, `government`, `admin`.

## Table Overview

| Table | Purpose |
|---|---|
| `organization` | Companies, authorities, logistics providers |
| `user` | Platform users with role + organization |
| `checkpoint` | Physical logistics locations (ports, customs, warehouses, hubs, borders, depots) |
| `route` | Transportation routes between cities |
| `route_checkpoint` | Ordered checkpoint sequence for a route (unique per `route_id, sequence_order`) |
| `shipment` | Shipment metadata, ownership, status, current location/checkpoint |
| `shipment_event` | Append-only timeline of every shipment state change |
| `alert` | Generated notifications (with severity, target role, resolved flag) |
| `user_alert` | Per-user alert delivery + read state (unique per `alert_id, user_id`) |
| `audit_log` | Append-only platform activity trail |
| `report` | Async report requests and their status |
| `invitation` | Pending/expired/accepted membership invitations |

## Constraints

Integrity is enforced with primary keys, foreign keys, NOT NULL, UNIQUE (e.g. `user_email`, `shipment_reference_number`, `checkpoint_code`, `route_code`, `invitation.token`), CHECK constraints (roles, statuses, severities, checkpoint types), and column defaults. Invalid business data cannot be inserted.

The shipment status CHECK covers: `draft`, `confirmed`, `picked_up`, `in_transit`, `at_checkpoint`, `customs_hold`, `customs_cleared`, `out_for_delivery`, `delivered`, `cancelled`, `delayed`. Legal **transitions** are enforced in the application state machine (`server/src/shipments/shipments.constants.ts`).

## Indexing Strategy

Indexes are created where they provide measurable value: primary/foreign keys, `shipment_reference_number`, `user_email`, `shipment_status` (including composite `(shipment_status, shipper_organization_id)` and `(shipment_status, shipment_estimated_arrival_at)` for the delay scanner), `shipment_created_at DESC`, `event_occurred_at DESC` (timeline), `route_origin_city + route_destination_city`, `user_alert (user_id, is_read)`, and `audit_performed_at DESC`.

## Audit Trail

Shipment history is append-only — every state transition creates a new `shipment_event`; existing events are never modified. Platform activity is recorded in `audit_log` (actor, organization, action, resource, old/new values, IP, user agent). Audit data is read-only through the API (`/api/admin/audit-logs`, `/api/organizations/:orgId/audit-logs`).

## Soft Delete Strategy

Business records are archived rather than destroyed: `organization_is_active`, `user_is_active`, `checkpoint_is_active`, `route_is_active`, and `alert_is_resolved` flags, toggled through the `*/deactivate`, `*/activate`, and `*/resolve` endpoints. Critical entities such as shipments are never permanently deleted (only `draft` shipments can be removed).

## Security Considerations

- Passwords are stored only as bcrypt hashes (`user_password_hash`).
- Refresh tokens are **not** stored in the database — they live in Redis as rotating families with reuse detection.
- Referential integrity, unique accounts/emails, and strict CHECK constraints prevent malformed data.
- UUID identifiers avoid enumerable IDs.

## Directory Structure

```text
database/
├── erd/
│   └── escv-database-erd.png
├── schema.sql        # Legacy design artifact — see "Source of Truth" above
└── README.md
```

The live schema lives in `server/prisma/` (`schema.prisma` + `migrations/`).

## License

**PROPRIETARY LICENSE** — © 2026 Egypt Supply Chain Visibility Team. All Rights Reserved.

This project is a university capstone project developed to demonstrate full-stack engineering skills applied to a real national infrastructure problem. This software and associated documentation are proprietary and confidential.
