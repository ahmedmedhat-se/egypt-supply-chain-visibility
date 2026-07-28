-- AlterTable
ALTER TABLE "shipment" ADD COLUMN     "carrier_user_id" UUID;

-- CreateIndex
CREATE INDEX "shipment_carrier_user_id_idx" ON "shipment"("carrier_user_id");

-- AddForeignKey
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_carrier_user_id_fkey" FOREIGN KEY ("carrier_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
