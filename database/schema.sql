CREATE DATABASE escv_db
    WITH
    OWNER            = postgres
    ENCODING         = 'UTF8'
    LC_COLLATE       = 'en_US.UTF-8'
    LC_CTYPE         = 'en_US.UTF-8'
    LOCALE_PROVIDER  = libc
    CONNECTION LIMIT = -1
    IS_TEMPLATE      = false;

COMMENT ON DATABASE escv_db
    IS 'Egypt Supply Chain Visibility Platform — National shipment tracking and logistics visibility system.';

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE organization (
    organization_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name        VARCHAR(255) NOT NULL,
    organization_type        VARCHAR(50) NOT NULL,
    organization_email       VARCHAR(255) NOT NULL UNIQUE,
    organization_phone       VARCHAR(30),
    organization_address     TEXT,
    organization_country     VARCHAR(100) NOT NULL DEFAULT 'Egypt',
    organization_is_active   BOOLEAN NOT NULL DEFAULT true,
    organization_created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    organization_updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_organization_type
        CHECK (organization_type IN ('shipper', 'carrier', 'regulator', 'government', 'admin'))
);

CREATE INDEX idx_organization_type ON organization (organization_type);
CREATE INDEX idx_organization_is_active ON organization (organization_is_active);

CREATE TABLE "user" (
    user_id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id          UUID NOT NULL REFERENCES organization (organization_id) ON DELETE RESTRICT,
    user_email               VARCHAR(255) NOT NULL UNIQUE,
    user_password_hash       VARCHAR(255) NOT NULL,
    user_first_name          VARCHAR(100) NOT NULL,
    user_last_name           VARCHAR(100) NOT NULL,
    user_role                VARCHAR(50) NOT NULL,
    user_phone               VARCHAR(30),
    user_is_active           BOOLEAN NOT NULL DEFAULT true,
    user_last_login_at       TIMESTAMPTZ,
    user_created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_user_role
        CHECK (user_role IN ('admin', 'shipper', 'carrier', 'regulator'))
);

CREATE INDEX idx_user_organization_id ON "user" (organization_id);
CREATE INDEX idx_user_role ON "user" (user_role);
CREATE INDEX idx_user_is_active ON "user" (user_is_active);

CREATE TABLE refresh_token (
    refresh_token_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID NOT NULL REFERENCES "user" (user_id) ON DELETE CASCADE,
    token_hash               VARCHAR(255) NOT NULL UNIQUE,
    token_expires_at         TIMESTAMPTZ NOT NULL,
    token_ip_address         INET,
    token_created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_token_user_id ON refresh_token (user_id);
CREATE INDEX idx_refresh_token_expires_at ON refresh_token (token_expires_at);

CREATE TABLE checkpoint (
    checkpoint_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checkpoint_name          VARCHAR(255) NOT NULL,
    checkpoint_code          VARCHAR(20) NOT NULL UNIQUE,
    checkpoint_type          VARCHAR(50) NOT NULL,
    checkpoint_city          VARCHAR(100) NOT NULL,
    checkpoint_latitude      NUMERIC(10, 7) NOT NULL,
    checkpoint_longitude     NUMERIC(10, 7) NOT NULL,
    checkpoint_is_active     BOOLEAN NOT NULL DEFAULT true,
    checkpoint_created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    checkpoint_updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_checkpoint_type
        CHECK (checkpoint_type IN ('port', 'customs', 'warehouse', 'hub', 'border', 'depot'))
);

CREATE INDEX idx_checkpoint_type ON checkpoint (checkpoint_type);
CREATE INDEX idx_checkpoint_city ON checkpoint (checkpoint_city);

CREATE TABLE route (
    route_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_name               VARCHAR(255) NOT NULL,
    route_code               VARCHAR(50) NOT NULL UNIQUE,
    route_origin_city        VARCHAR(100) NOT NULL,
    route_destination_city   VARCHAR(100) NOT NULL,
    route_estimated_days     INTEGER,
    route_is_active          BOOLEAN NOT NULL DEFAULT true,
    route_created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    route_updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_route_origin_destination
    ON route (route_origin_city, route_destination_city);

CREATE TABLE route_checkpoint (
    route_checkpoint_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id                 UUID NOT NULL REFERENCES route (route_id) ON DELETE CASCADE,
    checkpoint_id            UUID NOT NULL REFERENCES checkpoint (checkpoint_id) ON DELETE RESTRICT,
    sequence_order           INTEGER NOT NULL,
    checkpoint_is_optional   BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_route_sequence UNIQUE (route_id, sequence_order)
);

CREATE INDEX idx_route_checkpoint_route_id ON route_checkpoint (route_id);
CREATE INDEX idx_route_checkpoint_checkpoint_id ON route_checkpoint (checkpoint_id);

CREATE TABLE shipment (
    shipment_id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipper_organization_id           UUID NOT NULL REFERENCES organization (organization_id) ON DELETE RESTRICT,
    carrier_organization_id           UUID REFERENCES organization (organization_id) ON DELETE RESTRICT,
    route_id                          UUID REFERENCES route (route_id) ON DELETE RESTRICT,
    created_by_user_id                UUID NOT NULL REFERENCES "user" (user_id) ON DELETE RESTRICT,
    shipment_reference_number         VARCHAR(100) NOT NULL UNIQUE,
    shipment_status                   VARCHAR(50) NOT NULL DEFAULT 'draft',
    shipment_description              TEXT,
    shipment_cargo_type               VARCHAR(100),
    shipment_weight_kg                NUMERIC(10, 2),
    shipment_volume_m3                NUMERIC(10, 3),
    shipment_origin_address           TEXT NOT NULL,
    shipment_destination_address      TEXT NOT NULL,
    shipment_origin_city              VARCHAR(100) NOT NULL,
    shipment_destination_city         VARCHAR(100) NOT NULL,
    shipment_estimated_departure_at   TIMESTAMPTZ,
    shipment_estimated_arrival_at     TIMESTAMPTZ,
    shipment_actual_departure_at      TIMESTAMPTZ,
    shipment_actual_arrival_at        TIMESTAMPTZ,
    shipment_current_checkpoint_id    UUID REFERENCES checkpoint (checkpoint_id) ON DELETE SET NULL,
    shipment_current_latitude         NUMERIC(10, 7),
    shipment_current_longitude        NUMERIC(10, 7),
    shipment_notes                    TEXT,
    shipment_created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    shipment_updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_shipment_status CHECK (
        shipment_status IN (
            'draft', 'confirmed', 'picked_up', 'in_transit',
            'at_checkpoint', 'customs_hold', 'customs_cleared',
            'out_for_delivery', 'delivered', 'cancelled', 'delayed'
        )
    )
);

CREATE INDEX idx_shipment_shipper_org ON shipment (shipper_organization_id);
CREATE INDEX idx_shipment_carrier_org ON shipment (carrier_organization_id);
CREATE INDEX idx_shipment_status ON shipment (shipment_status);
CREATE INDEX idx_shipment_current_checkpoint ON shipment (shipment_current_checkpoint_id);
CREATE INDEX idx_shipment_created_at ON shipment (shipment_created_at DESC);
CREATE INDEX idx_shipment_status_shipper
    ON shipment (shipment_status, shipper_organization_id);

CREATE TABLE shipment_event (
    shipment_event_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id                  UUID NOT NULL REFERENCES shipment (shipment_id) ON DELETE RESTRICT,
    checkpoint_id                UUID REFERENCES checkpoint (checkpoint_id) ON DELETE SET NULL,
    recorded_by_user_id          UUID REFERENCES "user" (user_id) ON DELETE SET NULL,
    event_type                   VARCHAR(100) NOT NULL,
    event_status                 VARCHAR(50) NOT NULL,
    event_description            TEXT,
    event_latitude               NUMERIC(10, 7),
    event_longitude              NUMERIC(10, 7),
    event_occurred_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_metadata               JSONB
);

CREATE INDEX idx_shipment_event_shipment_id ON shipment_event (shipment_id);
CREATE INDEX idx_shipment_event_occurred_at ON shipment_event (event_occurred_at DESC);
CREATE INDEX idx_shipment_event_type ON shipment_event (event_type);
CREATE INDEX idx_shipment_event_timeline
    ON shipment_event (shipment_id, event_occurred_at DESC);

CREATE TABLE alert (
    alert_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id              UUID REFERENCES shipment (shipment_id) ON DELETE CASCADE,
    triggered_by_event_id    UUID REFERENCES shipment_event (shipment_event_id) ON DELETE SET NULL,
    alert_type               VARCHAR(100) NOT NULL,
    alert_severity           VARCHAR(20) NOT NULL DEFAULT 'info',
    alert_title              VARCHAR(255) NOT NULL,
    alert_message            TEXT NOT NULL,
    alert_target_role        VARCHAR(50),
    alert_is_resolved        BOOLEAN NOT NULL DEFAULT false,
    alert_resolved_at        TIMESTAMPTZ,
    alert_created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    alert_metadata           JSONB,
    CONSTRAINT chk_alert_severity
        CHECK (alert_severity IN ('info', 'warning', 'critical'))
);

CREATE INDEX idx_alert_shipment_id ON alert (shipment_id);
CREATE INDEX idx_alert_severity ON alert (alert_severity);
CREATE INDEX idx_alert_target_role ON alert (alert_target_role);
CREATE INDEX idx_alert_is_resolved ON alert (alert_is_resolved);

CREATE TABLE user_alert (
    user_alert_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id                 UUID NOT NULL REFERENCES alert (alert_id) ON DELETE CASCADE,
    user_id                  UUID NOT NULL REFERENCES "user" (user_id) ON DELETE CASCADE,
    is_read                  BOOLEAN NOT NULL DEFAULT false,
    read_at                  TIMESTAMPTZ,
    notified_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_alert UNIQUE (alert_id, user_id)
);

CREATE INDEX idx_user_alert_user_id ON user_alert (user_id);
CREATE INDEX idx_user_alert_unread ON user_alert (user_id, is_read) WHERE is_read = false;

CREATE TABLE audit_log (
    audit_log_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID REFERENCES "user" (user_id) ON DELETE SET NULL,
    audit_action             VARCHAR(100) NOT NULL,
    audit_resource_type      VARCHAR(100) NOT NULL,
    audit_resource_id        UUID,
    audit_old_value          JSONB,
    audit_new_value          JSONB,
    audit_ip_address         INET,
    audit_user_agent         TEXT,
    audit_performed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    audit_metadata           JSONB
);

CREATE INDEX idx_audit_log_user_id ON audit_log (user_id);
CREATE INDEX idx_audit_log_resource ON audit_log (audit_resource_type, audit_resource_id);
CREATE INDEX idx_audit_log_performed_at ON audit_log (audit_performed_at DESC);

CREATE TABLE report (
    report_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requested_by_user_id     UUID REFERENCES "user" (user_id) ON DELETE SET NULL,
    report_type              VARCHAR(100) NOT NULL,
    report_status            VARCHAR(50) NOT NULL DEFAULT 'pending',
    report_parameters        JSONB,
    report_file_path         TEXT,
    report_generated_at      TIMESTAMPTZ,
    report_expires_at        TIMESTAMPTZ,
    report_error_message     TEXT,
    report_created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_report_status
        CHECK (report_status IN ('pending', 'processing', 'completed', 'failed'))
);

CREATE INDEX idx_report_requested_by ON report (requested_by_user_id);
CREATE INDEX idx_report_status ON report (report_status);