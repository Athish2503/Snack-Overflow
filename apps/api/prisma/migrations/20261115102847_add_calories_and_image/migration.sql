-- AlterTable
ALTER TABLE "Snack" ADD COLUMN     "calories" INTEGER,
ADD COLUMN     "imageUrl" TEXT;

-- Constraint
ALTER TABLE "Snack"
ADD CONSTRAINT "snack_calories_nonnegative"
CHECK ("calories" IS NULL OR "calories" >= 0);
