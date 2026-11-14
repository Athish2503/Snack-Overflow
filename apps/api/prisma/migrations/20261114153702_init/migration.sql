-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "SnackCategory" AS ENUM ('SWEET', 'SAVOURY', 'DRINK', 'HEALTHY_ISH');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('CONSUMED', 'RESTOCKED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Snack" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "SnackCategory" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Snack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "snackId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "snackId" TEXT NOT NULL,
    "action" "ActivityAction" NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Snack_name_key" ON "Snack"("name");

-- CreateIndex
CREATE INDEX "Snack_category_idx" ON "Snack"("category");

-- CreateIndex
CREATE INDEX "Snack_quantity_idx" ON "Snack"("quantity");

-- CreateIndex
CREATE INDEX "Snack_archivedAt_idx" ON "Snack"("archivedAt");

-- CreateIndex
CREATE INDEX "Vote_snackId_idx" ON "Vote"("snackId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_userId_snackId_key" ON "Vote"("userId", "snackId");

-- CreateIndex
CREATE INDEX "Activity_snackId_createdAt_idx" ON "Activity"("snackId", "createdAt");

-- CreateIndex
CREATE INDEX "Activity_userId_createdAt_idx" ON "Activity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_snackId_fkey" FOREIGN KEY ("snackId") REFERENCES "Snack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_snackId_fkey" FOREIGN KEY ("snackId") REFERENCES "Snack"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Required Database Check Constraints
ALTER TABLE "Snack"
ADD CONSTRAINT "snack_quantity_nonnegative"
CHECK ("quantity" >= 0);

ALTER TABLE "Snack"
ADD CONSTRAINT "snack_threshold_nonnegative"
CHECK ("lowStockThreshold" >= 0);

ALTER TABLE "Activity"
ADD CONSTRAINT "activity_amount_positive"
CHECK ("amount" > 0);
