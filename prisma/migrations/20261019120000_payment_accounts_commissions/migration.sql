-- Business payment accounts (sent from the chat wallet) and monthly commission payments
CREATE TABLE IF NOT EXISTS "BusinessPaymentAccount" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "bankName" TEXT,
    "holderName" TEXT,
    "documentId" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "accountId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BusinessPaymentAccount_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BusinessPaymentAccount_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BusinessPaymentAccount_businessId_idx" ON "BusinessPaymentAccount"("businessId");

CREATE TABLE IF NOT EXISTS "CommissionPayment" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "salesAmount" DECIMAL(12,2) NOT NULL,
    "commissionAmount" DECIMAL(12,2) NOT NULL,
    "rate" DECIMAL(5,4) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'reported',
    "method" TEXT,
    "reference" TEXT,
    "receiptUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CommissionPayment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CommissionPayment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "CommissionPayment_businessId_period_key" ON "CommissionPayment"("businessId", "period");
