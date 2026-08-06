-- CreateIndex
CREATE INDEX "shipment_shipment_status_shipment_estimated_arrival_at_idx" ON "shipment"("shipment_status", "shipment_estimated_arrival_at");
