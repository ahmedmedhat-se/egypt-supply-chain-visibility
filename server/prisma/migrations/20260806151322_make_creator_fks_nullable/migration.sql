-- DropForeignKey
ALTER TABLE "invitation" DROP CONSTRAINT "invitation_created_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "shipment" DROP CONSTRAINT "shipment_created_by_user_id_fkey";

-- AlterTable
ALTER TABLE "shipment" ALTER COLUMN "created_by_user_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
