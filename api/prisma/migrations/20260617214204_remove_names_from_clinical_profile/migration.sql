/*
  Warnings:

  - You are about to drop the column `firstName` on the `ClinicalProfile` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `ClinicalProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."ClinicalProfile" DROP COLUMN "firstName",
DROP COLUMN "lastName";
