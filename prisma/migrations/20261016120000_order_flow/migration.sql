-- Order flow: delivery method, cancel reason and status history
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryMethod" TEXT NOT NULL DEFAULT 'delivery';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "cancelReason" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "statusHistory" JSONB;
