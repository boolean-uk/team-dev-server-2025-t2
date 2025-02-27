/*
  Warnings:

  - You are about to alter the column `content` on the `PostComment` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(2560)`.

*/
-- AlterTable
ALTER TABLE "PostComment" ALTER COLUMN "content" SET DATA TYPE VARCHAR(2560);
