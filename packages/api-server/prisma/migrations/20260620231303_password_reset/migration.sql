-- CreateTable
CREATE TABLE "app_password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_password_reset_tokens_tokenHash_key" ON "app_password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "app_password_reset_tokens_userId_consumedAt_idx" ON "app_password_reset_tokens"("userId", "consumedAt");

-- CreateIndex
CREATE INDEX "app_password_reset_tokens_expiresAt_idx" ON "app_password_reset_tokens"("expiresAt");

-- AddForeignKey
ALTER TABLE "app_password_reset_tokens" ADD CONSTRAINT "app_password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

