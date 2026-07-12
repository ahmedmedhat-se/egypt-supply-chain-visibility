/*
  Warnings:

  - Added the required column `token_family` to the `refresh_token` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token_version` to the `refresh_token` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "refresh_token" ADD COLUMN     "token_family" UUID NOT NULL,
ADD COLUMN     "token_is_revoked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "token_version" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "alert_shipment_id_idx" ON "alert"("shipment_id");

-- CreateIndex
CREATE INDEX "alert_alert_severity_idx" ON "alert"("alert_severity");

-- CreateIndex
CREATE INDEX "alert_alert_target_role_idx" ON "alert"("alert_target_role");

-- CreateIndex
CREATE INDEX "alert_alert_is_resolved_idx" ON "alert"("alert_is_resolved");

-- CreateIndex
CREATE INDEX "audit_log_user_id_idx" ON "audit_log"("user_id");

-- CreateIndex
CREATE INDEX "audit_log_audit_resource_type_audit_resource_id_idx" ON "audit_log"("audit_resource_type", "audit_resource_id");

-- CreateIndex
CREATE INDEX "audit_log_audit_performed_at_idx" ON "audit_log"("audit_performed_at" DESC);

-- CreateIndex
CREATE INDEX "checkpoint_checkpoint_type_idx" ON "checkpoint"("checkpoint_type");

-- CreateIndex
CREATE INDEX "checkpoint_checkpoint_city_idx" ON "checkpoint"("checkpoint_city");

-- CreateIndex
CREATE INDEX "organization_organization_type_idx" ON "organization"("organization_type");

-- CreateIndex
CREATE INDEX "organization_organization_is_active_idx" ON "organization"("organization_is_active");

-- CreateIndex
CREATE INDEX "refresh_token_user_id_idx" ON "refresh_token"("user_id");

-- CreateIndex
CREATE INDEX "refresh_token_token_family_token_version_idx" ON "refresh_token"("token_family", "token_version");

-- CreateIndex
CREATE INDEX "report_requested_by_user_id_idx" ON "report"("requested_by_user_id");

-- CreateIndex
CREATE INDEX "report_report_status_idx" ON "report"("report_status");

-- CreateIndex
CREATE INDEX "route_route_origin_city_route_destination_city_idx" ON "route"("route_origin_city", "route_destination_city");

-- CreateIndex
CREATE INDEX "route_checkpoint_route_id_idx" ON "route_checkpoint"("route_id");

-- CreateIndex
CREATE INDEX "route_checkpoint_checkpoint_id_idx" ON "route_checkpoint"("checkpoint_id");

-- CreateIndex
CREATE INDEX "shipment_shipper_organization_id_idx" ON "shipment"("shipper_organization_id");

-- CreateIndex
CREATE INDEX "shipment_carrier_organization_id_idx" ON "shipment"("carrier_organization_id");

-- CreateIndex
CREATE INDEX "shipment_shipment_status_idx" ON "shipment"("shipment_status");

-- CreateIndex
CREATE INDEX "shipment_shipment_current_checkpoint_id_idx" ON "shipment"("shipment_current_checkpoint_id");

-- CreateIndex
CREATE INDEX "shipment_shipment_created_at_idx" ON "shipment"("shipment_created_at" DESC);

-- CreateIndex
CREATE INDEX "shipment_shipment_status_shipper_organization_id_idx" ON "shipment"("shipment_status", "shipper_organization_id");

-- CreateIndex
CREATE INDEX "shipment_event_shipment_id_idx" ON "shipment_event"("shipment_id");

-- CreateIndex
CREATE INDEX "shipment_event_event_occurred_at_idx" ON "shipment_event"("event_occurred_at" DESC);

-- CreateIndex
CREATE INDEX "shipment_event_event_type_idx" ON "shipment_event"("event_type");

-- CreateIndex
CREATE INDEX "shipment_event_shipment_id_event_occurred_at_idx" ON "shipment_event"("shipment_id", "event_occurred_at" DESC);

-- CreateIndex
CREATE INDEX "user_organization_id_idx" ON "user"("organization_id");

-- CreateIndex
CREATE INDEX "user_user_role_idx" ON "user"("user_role");

-- CreateIndex
CREATE INDEX "user_user_is_active_idx" ON "user"("user_is_active");

-- CreateIndex
CREATE INDEX "user_alert_user_id_idx" ON "user_alert"("user_id");

-- CreateIndex
CREATE INDEX "user_alert_user_id_is_read_idx" ON "user_alert"("user_id", "is_read");
