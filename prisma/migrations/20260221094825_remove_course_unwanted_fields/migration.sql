/*
  Warnings:

  - You are about to drop the column `category` on the `course` table. All the data in the column will be lost.
  - You are about to drop the column `fee` on the `course` table. All the data in the column will be lost.
  - You are about to drop the column `seats` on the `course` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `course` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `course` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "course" DROP COLUMN "category",
DROP COLUMN "fee",
DROP COLUMN "seats",
DROP COLUMN "startDate",
DROP COLUMN "status";
