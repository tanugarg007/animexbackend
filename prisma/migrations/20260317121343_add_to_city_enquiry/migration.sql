/*
  Warnings:

  - Made the column `city` on table `enquiry` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "enquiry" ALTER COLUMN "city" SET NOT NULL;
