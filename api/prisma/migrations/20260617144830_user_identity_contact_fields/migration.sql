-- CreateEnum
CREATE TYPE "public"."IdType" AS ENUM ('PASSPORT', 'VISA', 'DRIVER_LICENSE', 'PPS');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "cityCounty" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "idNumber" TEXT,
ADD COLUMN     "idType" "public"."IdType",
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "postalCode" TEXT;
