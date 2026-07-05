-- CreateTable
CREATE TABLE "organization" (
    "organization_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_name" VARCHAR(255) NOT NULL,
    "organization_type" VARCHAR(50) NOT NULL,
    "organization_email" VARCHAR(255) NOT NULL,
    "organization_phone" VARCHAR(30),
    "organization_address" TEXT,
    "organization_country" VARCHAR(100) NOT NULL DEFAULT 'Egypt',
    "organization_is_active" BOOLEAN NOT NULL DEFAULT true,
    "organization_created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization_updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("organization_id")
);

-- CreateTable
CREATE TABLE "user" (
    "user_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "user_email" VARCHAR(255) NOT NULL,
    "user_password_hash" VARCHAR(255) NOT NULL,
    "user_first_name" VARCHAR(100) NOT NULL,
    "user_last_name" VARCHAR(100) NOT NULL,
    "user_role" VARCHAR(50) NOT NULL,
    "user_phone" VARCHAR(30),
    "user_is_active" BOOLEAN NOT NULL DEFAULT true,
    "user_last_login_at" TIMESTAMPTZ,
    "user_created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "refresh_token_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "token_expires_at" TIMESTAMPTZ NOT NULL,
    "token_ip_address" VARCHAR(50),
    "token_created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("refresh_token_id")
);

-- CreateTable
CREATE TABLE "checkpoint" (
    "checkpoint_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "checkpoint_name" VARCHAR(255) NOT NULL,
    "checkpoint_code" VARCHAR(20) NOT NULL,
    "checkpoint_type" VARCHAR(50) NOT NULL,
    "checkpoint_city" VARCHAR(100) NOT NULL,
    "checkpoint_latitude" DECIMAL(10,7) NOT NULL,
    "checkpoint_longitude" DECIMAL(10,7) NOT NULL,
    "checkpoint_is_active" BOOLEAN NOT NULL DEFAULT true,
    "checkpoint_created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkpoint_updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "checkpoint_pkey" PRIMARY KEY ("checkpoint_id")
);

-- CreateTable
CREATE TABLE "route" (
    "route_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "route_name" VARCHAR(255) NOT NULL,
    "route_code" VARCHAR(50) NOT NULL,
    "route_origin_city" VARCHAR(100) NOT NULL,
    "route_destination_city" VARCHAR(100) NOT NULL,
    "route_estimated_days" INTEGER,
    "route_is_active" BOOLEAN NOT NULL DEFAULT true,
    "route_created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "route_updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "route_pkey" PRIMARY KEY ("route_id")
);

-- CreateTable
CREATE TABLE "route_checkpoint" (
    "route_checkpoint_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "route_id" UUID NOT NULL,
    "checkpoint_id" UUID NOT NULL,
    "sequence_order" INTEGER NOT NULL,
    "checkpoint_is_optional" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "route_checkpoint_pkey" PRIMARY KEY ("route_checkpoint_id")
);

-- CreateTable
CREATE TABLE "shipment" (
    "shipment_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shipper_organization_id" UUID NOT NULL,
    "carrier_organization_id" UUID,
    "route_id" UUID,
    "created_by_user_id" UUID NOT NULL,
    "shipment_reference_number" VARCHAR(100) NOT NULL,
    "shipment_status" VARCHAR(50) NOT NULL DEFAULT 'draft',
    "shipment_description" TEXT,
    "shipment_cargo_type" VARCHAR(100),
    "shipment_weight_kg" DECIMAL(10,2),
    "shipment_volume_m3" DECIMAL(10,3),
    "shipment_origin_address" TEXT NOT NULL,
    "shipment_destination_address" TEXT NOT NULL,
    "shipment_origin_city" VARCHAR(100) NOT NULL,
    "shipment_destination_city" VARCHAR(100) NOT NULL,
    "shipment_estimated_departure_at" TIMESTAMPTZ,
    "shipment_estimated_arrival_at" TIMESTAMPTZ,
    "shipment_actual_departure_at" TIMESTAMPTZ,
    "shipment_actual_arrival_at" TIMESTAMPTZ,
    "shipment_current_checkpoint_id" UUID,
    "shipment_current_latitude" DECIMAL(10,7),
    "shipment_current_longitude" DECIMAL(10,7),
    "shipment_notes" TEXT,
    "shipment_created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shipment_updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "shipment_pkey" PRIMARY KEY ("shipment_id")
);

-- CreateTable
CREATE TABLE "shipment_event" (
    "shipment_event_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shipment_id" UUID NOT NULL,
    "checkpoint_id" UUID,
    "recorded_by_user_id" UUID,
    "event_type" VARCHAR(100) NOT NULL,
    "event_status" VARCHAR(50) NOT NULL,
    "event_description" TEXT,
    "event_latitude" DECIMAL(10,7),
    "event_longitude" DECIMAL(10,7),
    "event_occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event_metadata" JSONB,

    CONSTRAINT "shipment_event_pkey" PRIMARY KEY ("shipment_event_id")
);

-- CreateTable
CREATE TABLE "alert" (
    "alert_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shipment_id" UUID,
    "triggered_by_event_id" UUID,
    "alert_type" VARCHAR(100) NOT NULL,
    "alert_severity" VARCHAR(20) NOT NULL DEFAULT 'info',
    "alert_title" VARCHAR(255) NOT NULL,
    "alert_message" TEXT NOT NULL,
    "alert_target_role" VARCHAR(50),
    "alert_is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "alert_resolved_at" TIMESTAMPTZ,
    "alert_created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alert_metadata" JSONB,

    CONSTRAINT "alert_pkey" PRIMARY KEY ("alert_id")
);

-- CreateTable
CREATE TABLE "user_alert" (
    "user_alert_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "alert_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ,
    "notified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_alert_pkey" PRIMARY KEY ("user_alert_id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "audit_log_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "audit_action" VARCHAR(100) NOT NULL,
    "audit_resource_type" VARCHAR(100) NOT NULL,
    "audit_resource_id" UUID,
    "audit_old_value" JSONB,
    "audit_new_value" JSONB,
    "audit_ip_address" VARCHAR(50),
    "audit_user_agent" TEXT,
    "audit_performed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "audit_metadata" JSONB,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("audit_log_id")
);

-- CreateTable
CREATE TABLE "report" (
    "report_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "requested_by_user_id" UUID,
    "report_type" VARCHAR(100) NOT NULL,
    "report_status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "report_parameters" JSONB,
    "report_file_path" TEXT,
    "report_generated_at" TIMESTAMPTZ,
    "report_expires_at" TIMESTAMPTZ,
    "report_error_message" TEXT,
    "report_created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_pkey" PRIMARY KEY ("report_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_organization_email_key" ON "organization"("organization_email");

-- CreateIndex
CREATE UNIQUE INDEX "user_user_email_key" ON "user"("user_email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_token_hash_key" ON "refresh_token"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "checkpoint_checkpoint_code_key" ON "checkpoint"("checkpoint_code");

-- CreateIndex
CREATE UNIQUE INDEX "route_route_code_key" ON "route"("route_code");

-- CreateIndex
CREATE UNIQUE INDEX "route_checkpoint_route_id_sequence_order_key" ON "route_checkpoint"("route_id", "sequence_order");

-- CreateIndex
CREATE UNIQUE INDEX "shipment_shipment_reference_number_key" ON "shipment"("shipment_reference_number");

-- CreateIndex
CREATE UNIQUE INDEX "user_alert_alert_id_user_id_key" ON "user_alert"("alert_id", "user_id");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_checkpoint" ADD CONSTRAINT "route_checkpoint_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "route"("route_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_checkpoint" ADD CONSTRAINT "route_checkpoint_checkpoint_id_fkey" FOREIGN KEY ("checkpoint_id") REFERENCES "checkpoint"("checkpoint_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_shipper_organization_id_fkey" FOREIGN KEY ("shipper_organization_id") REFERENCES "organization"("organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_carrier_organization_id_fkey" FOREIGN KEY ("carrier_organization_id") REFERENCES "organization"("organization_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "route"("route_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_shipment_current_checkpoint_id_fkey" FOREIGN KEY ("shipment_current_checkpoint_id") REFERENCES "checkpoint"("checkpoint_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_event" ADD CONSTRAINT "shipment_event_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipment"("shipment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_event" ADD CONSTRAINT "shipment_event_checkpoint_id_fkey" FOREIGN KEY ("checkpoint_id") REFERENCES "checkpoint"("checkpoint_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_event" ADD CONSTRAINT "shipment_event_recorded_by_user_id_fkey" FOREIGN KEY ("recorded_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert" ADD CONSTRAINT "alert_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipment"("shipment_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert" ADD CONSTRAINT "alert_triggered_by_event_id_fkey" FOREIGN KEY ("triggered_by_event_id") REFERENCES "shipment_event"("shipment_event_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_alert" ADD CONSTRAINT "user_alert_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "alert"("alert_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_alert" ADD CONSTRAINT "user_alert_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
