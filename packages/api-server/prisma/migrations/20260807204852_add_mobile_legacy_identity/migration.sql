-- CreateTable
CREATE TABLE "app_mobile_legacy_identities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "legacyUserId" INTEGER NOT NULL,
    "legacyRoleId" INTEGER NOT NULL,
    "legacyPlanId" INTEGER NOT NULL,
    "legacyLevelId" INTEGER NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "firstName" TEXT,
    "lastName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_mobile_legacy_identities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_mobile_legacy_identities_userId_key" ON "app_mobile_legacy_identities"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "app_mobile_legacy_identities_legacyUserId_key" ON "app_mobile_legacy_identities"("legacyUserId");

-- AddForeignKey
ALTER TABLE "app_mobile_legacy_identities" ADD CONSTRAINT "app_mobile_legacy_identities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
