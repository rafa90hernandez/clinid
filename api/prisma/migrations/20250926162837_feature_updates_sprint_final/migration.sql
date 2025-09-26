-- AlterTable
ALTER TABLE "public"."PublicCredential" ADD COLUMN     "consentAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
