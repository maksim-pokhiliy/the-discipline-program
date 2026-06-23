-- CreateEnum
CREATE TYPE "ProfileAxisBinding" AS ENUM ('GENDER');

-- AlterTable
ALTER TABLE "app_profile_axes" ADD COLUMN     "binding" "ProfileAxisBinding";

-- CreateIndex
CREATE UNIQUE INDEX "app_profile_axes_binding_key" ON "app_profile_axes"("binding");

INSERT INTO "app_profile_axes" ("id", "key", "label", "values", "binding", "createdAt", "updatedAt")
VALUES ('cgender000000000000000000', 'gender', 'Gender', ARRAY['Male', 'Female'], 'GENDER', NOW(), NOW())
ON CONFLICT DO NOTHING;
