/*
  Warnings:

  - You are about to drop the `Profile` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `cohortNumber` to the `Cohort` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_userId_fkey";

-- AlterTable
ALTER TABLE "Cohort" ADD COLUMN     "cohortNumber" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "githubUrl" TEXT,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "userName" TEXT NOT NULL;

-- DropTable
DROP TABLE "Profile";
