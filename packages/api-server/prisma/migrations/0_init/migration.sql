-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ATHLETE', 'COACH', 'HEAD_COACH', 'ADMIN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'EUR', 'UAH');

-- CreateEnum
CREATE TYPE "PriceInterval" AS ENUM ('MONTHLY', 'YEARLY', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "TrainingPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'REMOVED');

-- CreateEnum
CREATE TYPE "HealthStatus" AS ENUM ('HEALTHY', 'INJURED', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "ActionItemType" AS ENUM ('MISSED_WORKOUTS', 'HEALTH_REPORT');

-- CreateEnum
CREATE TYPE "ActionItemStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ActionItemResolveReason" AS ENUM ('AUTO_CONDITION_CLEARED', 'AUTO_ASSIGNMENT_ENDED', 'MANUAL_CONTACTED');

-- CreateEnum
CREATE TYPE "ActionItemSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "MarketingBlogCategory" AS ENUM ('UNCATEGORIZED', 'FITNESS', 'NUTRITION', 'MINDSET', 'TRAINING', 'RECOVERY');

-- CreateEnum
CREATE TYPE "ContactSubmissionStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'REPLIED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "ExerciseNature" AS ENUM ('CONCRETE', 'PLACEHOLDER', 'REST');

-- CreateEnum
CREATE TYPE "OneRMRecordSource" AS ENUM ('MANUAL', 'AUTO_INFERRED', 'TESTED');

-- CreateEnum
CREATE TYPE "AppLevel" AS ENUM ('DAY', 'SESSION', 'BLOCK');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "password" TEXT,
    "role" "Role" NOT NULL DEFAULT 'ATHLETE',
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_athlete_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gender" "Gender",
    "heightCm" INTEGER,
    "weightKg" DECIMAL(5,2),
    "profileSelections" JSONB,
    "healthStatus" "HealthStatus" NOT NULL DEFAULT 'HEALTHY',
    "healthNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_athlete_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_coach_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "location" TEXT,
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "app_coach_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_coach_credentials" (
    "id" TEXT NOT NULL,
    "coachProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "shownToAthletes" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_coach_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_coach_athlete_assignments" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_coach_athlete_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_products" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "features" TEXT[],
    "stripeProductId" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "app_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_prices" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "interval" "PriceInterval" NOT NULL DEFAULT 'MONTHLY',
    "stripePriceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "app_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "priceId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "graceEndsAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currency" "Currency" NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "providerTxId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_request_idempotency" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "requestFingerprint" TEXT NOT NULL,
    "responseStatus" INTEGER NOT NULL,
    "responseBody" JSONB NOT NULL,
    "responseHeaders" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_request_idempotency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_training_plans" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "status" "TrainingPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "lms_training_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_plan_enrollments" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "enrolledById" TEXT NOT NULL,
    "boardedAt" DATE NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hidePastBeforeBoarding" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "lms_plan_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_coach_action_items" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "type" "ActionItemType" NOT NULL,
    "severity" "ActionItemSeverity" NOT NULL,
    "status" "ActionItemStatus" NOT NULL DEFAULT 'OPEN',
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "resolvedAt" TIMESTAMP(3),
    "resolveReason" "ActionItemResolveReason",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_coach_action_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_coach_notes" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_coach_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_pages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "seoTitle" TEXT,
    "seoDesc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_page_sections" (
    "id" TEXT NOT NULL,
    "pageSlug" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_page_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_blog_posts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "authorName" TEXT NOT NULL,
    "category" "MarketingBlogCategory" NOT NULL DEFAULT 'UNCATEGORIZED',
    "tags" TEXT[],
    "readTime" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "marketing_blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_reviews" (
    "id" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorRole" TEXT,
    "authorAvatar" TEXT,
    "text" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "marketing_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_contact_submissions" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "contact" TEXT,
    "program" TEXT,
    "message" TEXT NOT NULL,
    "status" "ContactSubmissionStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "marketing_contact_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_user_invite_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdByAdminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_user_invite_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_weeks" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "notes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_weeks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_days" (
    "id" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "labelId" TEXT,
    "notes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_sessions" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "labelId" TEXT,
    "notes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_blocks" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "intensity" JSONB,
    "notes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_schema_groups" (
    "id" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "notes" JSONB,
    "interleaveOrder" TEXT NOT NULL DEFAULT 'round_by_round',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_schema_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_block_label_assignments" (
    "id" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "training_block_label_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_schemas" (
    "id" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "groupId" TEXT,
    "order" INTEGER NOT NULL,
    "header" TEXT,
    "composition" JSONB,
    "intensity" JSONB,
    "notes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_schemas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_schema_rows" (
    "id" TEXT NOT NULL,
    "schemaId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "sets" INTEGER,
    "rowGroupId" TEXT,
    "load" JSONB,
    "reps" JSONB,
    "side" JSONB,
    "tempo" JSONB,
    "media" JSONB,
    "intensity" JSONB,
    "rest" JSONB,
    "notes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_schema_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_exercises" (
    "id" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "canonicalNameLower" TEXT NOT NULL,
    "nature" "ExerciseNature" NOT NULL DEFAULT 'CONCRETE',
    "defaultDemoUrls" TEXT[],
    "aliases" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_labels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameLower" TEXT NOT NULL,
    "applicableLevels" JSONB NOT NULL,
    "notes" TEXT,
    "rest" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_modifiers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameLower" TEXT NOT NULL,
    "notes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_modifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_row_modifier_assignments" (
    "id" TEXT NOT NULL,
    "rowId" TEXT NOT NULL,
    "modifierId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "training_row_modifier_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_row_groups" (
    "id" TEXT NOT NULL,
    "schemaId" TEXT NOT NULL,
    "notes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_row_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_one_rm_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "valueKg" DECIMAL(6,2) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "source" "OneRMRecordSource" NOT NULL,

    CONSTRAINT "training_one_rm_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_performed_sessions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "coachNotes" TEXT,
    "athleteNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_performed_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_benchmark_results" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plannedSchemaId" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_benchmark_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE INDEX "users_name_idx" ON "users"("name");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_deletedAt_idx" ON "users"("role", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "app_athlete_profiles_userId_key" ON "app_athlete_profiles"("userId");

-- CreateIndex
CREATE INDEX "app_athlete_profiles_createdAt_idx" ON "app_athlete_profiles"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "app_coach_profiles_userId_key" ON "app_coach_profiles"("userId");

-- CreateIndex
CREATE INDEX "app_coach_profiles_createdAt_idx" ON "app_coach_profiles"("createdAt");

-- CreateIndex
CREATE INDEX "app_coach_profiles_deletedAt_idx" ON "app_coach_profiles"("deletedAt");

-- CreateIndex
CREATE INDEX "app_coach_credentials_coachProfileId_idx" ON "app_coach_credentials"("coachProfileId");

-- CreateIndex
CREATE INDEX "app_coach_athlete_assignments_coachId_idx" ON "app_coach_athlete_assignments"("coachId");

-- CreateIndex
CREATE INDEX "app_coach_athlete_assignments_athleteId_idx" ON "app_coach_athlete_assignments"("athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "app_coach_athlete_assignments_coachId_athleteId_key" ON "app_coach_athlete_assignments"("coachId", "athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "app_products_slug_key" ON "app_products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "app_products_stripeProductId_key" ON "app_products"("stripeProductId");

-- CreateIndex
CREATE INDEX "app_products_createdAt_title_idx" ON "app_products"("createdAt", "title");

-- CreateIndex
CREATE INDEX "app_products_deletedAt_idx" ON "app_products"("deletedAt");

-- CreateIndex
CREATE INDEX "app_products_isActive_idx" ON "app_products"("isActive");

-- CreateIndex
CREATE INDEX "app_products_isFeatured_idx" ON "app_products"("isFeatured");

-- CreateIndex
CREATE UNIQUE INDEX "app_prices_stripePriceId_key" ON "app_prices"("stripePriceId");

-- CreateIndex
CREATE INDEX "app_prices_productId_isActive_idx" ON "app_prices"("productId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "app_subscriptions_userId_key" ON "app_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "app_subscriptions_createdAt_idx" ON "app_subscriptions"("createdAt");

-- CreateIndex
CREATE INDEX "app_subscriptions_status_idx" ON "app_subscriptions"("status");

-- CreateIndex
CREATE INDEX "app_subscriptions_priceId_idx" ON "app_subscriptions"("priceId");

-- CreateIndex
CREATE UNIQUE INDEX "app_transactions_providerTxId_key" ON "app_transactions"("providerTxId");

-- CreateIndex
CREATE UNIQUE INDEX "app_transactions_idempotencyKey_key" ON "app_transactions"("idempotencyKey");

-- CreateIndex
CREATE INDEX "app_transactions_createdAt_idx" ON "app_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "app_transactions_userId_status_idx" ON "app_transactions"("userId", "status");

-- CreateIndex
CREATE INDEX "app_transactions_subscriptionId_idx" ON "app_transactions"("subscriptionId");

-- CreateIndex
CREATE INDEX "app_request_idempotency_expiresAt_idx" ON "app_request_idempotency"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "app_request_idempotency_key_scope_route_key" ON "app_request_idempotency"("key", "scope", "route");

-- CreateIndex
CREATE INDEX "lms_training_plans_creatorId_idx" ON "lms_training_plans"("creatorId");

-- CreateIndex
CREATE INDEX "lms_training_plans_status_idx" ON "lms_training_plans"("status");

-- CreateIndex
CREATE INDEX "lms_training_plans_deletedAt_idx" ON "lms_training_plans"("deletedAt");

-- CreateIndex
CREATE INDEX "lms_plan_enrollments_planId_status_idx" ON "lms_plan_enrollments"("planId", "status");

-- CreateIndex
CREATE INDEX "lms_plan_enrollments_athleteId_status_idx" ON "lms_plan_enrollments"("athleteId", "status");

-- CreateIndex
CREATE INDEX "lms_plan_enrollments_enrolledById_idx" ON "lms_plan_enrollments"("enrolledById");

-- CreateIndex
CREATE INDEX "lms_plan_enrollments_deletedAt_idx" ON "lms_plan_enrollments"("deletedAt");

-- CreateIndex
CREATE INDEX "app_coach_action_items_coachId_status_idx" ON "app_coach_action_items"("coachId", "status");

-- CreateIndex
CREATE INDEX "app_coach_action_items_coachId_status_athleteId_idx" ON "app_coach_action_items"("coachId", "status", "athleteId");

-- CreateIndex
CREATE INDEX "app_coach_action_items_coachId_status_resolvedAt_idx" ON "app_coach_action_items"("coachId", "status", "resolvedAt");

-- CreateIndex
CREATE INDEX "app_coach_action_items_athleteId_idx" ON "app_coach_action_items"("athleteId");

-- CreateIndex
CREATE INDEX "app_coach_action_items_createdAt_idx" ON "app_coach_action_items"("createdAt");

-- CreateIndex
CREATE INDEX "app_coach_notes_coachId_athleteId_idx" ON "app_coach_notes"("coachId", "athleteId");

-- CreateIndex
CREATE INDEX "app_coach_notes_coachId_createdAt_idx" ON "app_coach_notes"("coachId", "createdAt");

-- CreateIndex
CREATE INDEX "app_coach_notes_athleteId_idx" ON "app_coach_notes"("athleteId");

-- CreateIndex
CREATE INDEX "app_coach_notes_createdAt_idx" ON "app_coach_notes"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_pages_slug_key" ON "marketing_pages"("slug");

-- CreateIndex
CREATE INDEX "marketing_page_sections_pageSlug_isActive_idx" ON "marketing_page_sections"("pageSlug", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_page_sections_pageSlug_section_key" ON "marketing_page_sections"("pageSlug", "section");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_blog_posts_slug_key" ON "marketing_blog_posts"("slug");

-- CreateIndex
CREATE INDEX "marketing_blog_posts_createdAt_title_idx" ON "marketing_blog_posts"("createdAt", "title");

-- CreateIndex
CREATE INDEX "marketing_blog_posts_deletedAt_idx" ON "marketing_blog_posts"("deletedAt");

-- CreateIndex
CREATE INDEX "marketing_blog_posts_isPublished_publishedAt_idx" ON "marketing_blog_posts"("isPublished", "publishedAt");

-- CreateIndex
CREATE INDEX "marketing_blog_posts_isPublished_category_publishedAt_idx" ON "marketing_blog_posts"("isPublished", "category", "publishedAt");

-- CreateIndex
CREATE INDEX "marketing_blog_posts_category_idx" ON "marketing_blog_posts"("category");

-- CreateIndex
CREATE INDEX "marketing_blog_posts_isFeatured_idx" ON "marketing_blog_posts"("isFeatured");

-- CreateIndex
CREATE INDEX "marketing_reviews_createdAt_idx" ON "marketing_reviews"("createdAt");

-- CreateIndex
CREATE INDEX "marketing_reviews_deletedAt_idx" ON "marketing_reviews"("deletedAt");

-- CreateIndex
CREATE INDEX "marketing_reviews_isActive_idx" ON "marketing_reviews"("isActive");

-- CreateIndex
CREATE INDEX "marketing_contact_submissions_createdAt_idx" ON "marketing_contact_submissions"("createdAt");

-- CreateIndex
CREATE INDEX "marketing_contact_submissions_deletedAt_idx" ON "marketing_contact_submissions"("deletedAt");

-- CreateIndex
CREATE INDEX "marketing_contact_submissions_status_idx" ON "marketing_contact_submissions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "app_user_invite_tokens_tokenHash_key" ON "app_user_invite_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "app_user_invite_tokens_userId_consumedAt_idx" ON "app_user_invite_tokens"("userId", "consumedAt");

-- CreateIndex
CREATE INDEX "app_user_invite_tokens_expiresAt_idx" ON "app_user_invite_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "app_user_invite_tokens_createdByAdminId_idx" ON "app_user_invite_tokens"("createdByAdminId");

-- CreateIndex
CREATE INDEX "training_weeks_planId_startDate_idx" ON "training_weeks"("planId", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "training_weeks_planId_startDate_key" ON "training_weeks"("planId", "startDate");

-- CreateIndex
CREATE INDEX "training_days_weekId_dayOfWeek_idx" ON "training_days"("weekId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "training_days_labelId_idx" ON "training_days"("labelId");

-- CreateIndex
CREATE UNIQUE INDEX "training_days_weekId_dayOfWeek_key" ON "training_days"("weekId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "training_sessions_dayId_order_idx" ON "training_sessions"("dayId", "order");

-- CreateIndex
CREATE INDEX "training_sessions_labelId_idx" ON "training_sessions"("labelId");

-- CreateIndex
CREATE INDEX "training_blocks_sessionId_order_idx" ON "training_blocks"("sessionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "training_blocks_sessionId_order_key" ON "training_blocks"("sessionId", "order");

-- CreateIndex
CREATE INDEX "training_schema_groups_blockId_idx" ON "training_schema_groups"("blockId");

-- CreateIndex
CREATE INDEX "training_block_label_assignments_blockId_order_idx" ON "training_block_label_assignments"("blockId", "order");

-- CreateIndex
CREATE INDEX "training_block_label_assignments_labelId_idx" ON "training_block_label_assignments"("labelId");

-- CreateIndex
CREATE UNIQUE INDEX "training_block_label_assignments_blockId_labelId_key" ON "training_block_label_assignments"("blockId", "labelId");

-- CreateIndex
CREATE INDEX "training_schemas_blockId_order_idx" ON "training_schemas"("blockId", "order");

-- CreateIndex
CREATE INDEX "training_schemas_groupId_idx" ON "training_schemas"("groupId");

-- CreateIndex
CREATE INDEX "training_schema_rows_schemaId_order_idx" ON "training_schema_rows"("schemaId", "order");

-- CreateIndex
CREATE INDEX "training_schema_rows_exerciseId_idx" ON "training_schema_rows"("exerciseId");

-- CreateIndex
CREATE INDEX "training_schema_rows_rowGroupId_idx" ON "training_schema_rows"("rowGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "training_schema_rows_schemaId_order_key" ON "training_schema_rows"("schemaId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "training_exercises_canonicalNameLower_key" ON "training_exercises"("canonicalNameLower");

-- CreateIndex
CREATE INDEX "training_exercises_canonicalName_idx" ON "training_exercises"("canonicalName");

-- CreateIndex
CREATE UNIQUE INDEX "training_labels_nameLower_key" ON "training_labels"("nameLower");

-- CreateIndex
CREATE INDEX "training_labels_name_idx" ON "training_labels"("name");

-- CreateIndex
CREATE UNIQUE INDEX "training_modifiers_nameLower_key" ON "training_modifiers"("nameLower");

-- CreateIndex
CREATE INDEX "training_modifiers_name_idx" ON "training_modifiers"("name");

-- CreateIndex
CREATE INDEX "training_row_modifier_assignments_rowId_order_idx" ON "training_row_modifier_assignments"("rowId", "order");

-- CreateIndex
CREATE INDEX "training_row_modifier_assignments_modifierId_idx" ON "training_row_modifier_assignments"("modifierId");

-- CreateIndex
CREATE UNIQUE INDEX "training_row_modifier_assignments_rowId_modifierId_key" ON "training_row_modifier_assignments"("rowId", "modifierId");

-- CreateIndex
CREATE INDEX "training_row_groups_schemaId_idx" ON "training_row_groups"("schemaId");

-- CreateIndex
CREATE INDEX "training_one_rm_records_userId_exerciseId_recordedAt_idx" ON "training_one_rm_records"("userId", "exerciseId", "recordedAt");

-- CreateIndex
CREATE INDEX "training_one_rm_records_exerciseId_idx" ON "training_one_rm_records"("exerciseId");

-- CreateIndex
CREATE INDEX "training_performed_sessions_sessionId_userId_performedAt_idx" ON "training_performed_sessions"("sessionId", "userId", "performedAt");

-- CreateIndex
CREATE INDEX "training_performed_sessions_userId_idx" ON "training_performed_sessions"("userId");

-- CreateIndex
CREATE INDEX "training_benchmark_results_userId_plannedSchemaId_recordedA_idx" ON "training_benchmark_results"("userId", "plannedSchemaId", "recordedAt");

-- CreateIndex
CREATE INDEX "training_benchmark_results_plannedSchemaId_idx" ON "training_benchmark_results"("plannedSchemaId");

-- AddForeignKey
ALTER TABLE "app_athlete_profiles" ADD CONSTRAINT "app_athlete_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_coach_profiles" ADD CONSTRAINT "app_coach_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_coach_credentials" ADD CONSTRAINT "app_coach_credentials_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "app_coach_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_coach_athlete_assignments" ADD CONSTRAINT "app_coach_athlete_assignments_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "app_coach_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_coach_athlete_assignments" ADD CONSTRAINT "app_coach_athlete_assignments_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_prices" ADD CONSTRAINT "app_prices_productId_fkey" FOREIGN KEY ("productId") REFERENCES "app_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_subscriptions" ADD CONSTRAINT "app_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_subscriptions" ADD CONSTRAINT "app_subscriptions_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "app_prices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_transactions" ADD CONSTRAINT "app_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_transactions" ADD CONSTRAINT "app_transactions_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "app_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_training_plans" ADD CONSTRAINT "lms_training_plans_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_plan_enrollments" ADD CONSTRAINT "lms_plan_enrollments_planId_fkey" FOREIGN KEY ("planId") REFERENCES "lms_training_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_plan_enrollments" ADD CONSTRAINT "lms_plan_enrollments_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_plan_enrollments" ADD CONSTRAINT "lms_plan_enrollments_enrolledById_fkey" FOREIGN KEY ("enrolledById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_coach_action_items" ADD CONSTRAINT "app_coach_action_items_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "app_coach_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_coach_action_items" ADD CONSTRAINT "app_coach_action_items_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_coach_notes" ADD CONSTRAINT "app_coach_notes_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "app_coach_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_coach_notes" ADD CONSTRAINT "app_coach_notes_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_page_sections" ADD CONSTRAINT "marketing_page_sections_pageSlug_fkey" FOREIGN KEY ("pageSlug") REFERENCES "marketing_pages"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_user_invite_tokens" ADD CONSTRAINT "app_user_invite_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_user_invite_tokens" ADD CONSTRAINT "app_user_invite_tokens_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_weeks" ADD CONSTRAINT "training_weeks_planId_fkey" FOREIGN KEY ("planId") REFERENCES "lms_training_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_days" ADD CONSTRAINT "training_days_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "training_weeks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_days" ADD CONSTRAINT "training_days_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "training_labels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "training_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "training_labels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_blocks" ADD CONSTRAINT "training_blocks_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "training_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_schema_groups" ADD CONSTRAINT "training_schema_groups_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "training_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_block_label_assignments" ADD CONSTRAINT "training_block_label_assignments_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "training_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_block_label_assignments" ADD CONSTRAINT "training_block_label_assignments_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "training_labels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_schemas" ADD CONSTRAINT "training_schemas_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "training_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_schemas" ADD CONSTRAINT "training_schemas_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "training_schema_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_schema_rows" ADD CONSTRAINT "training_schema_rows_schemaId_fkey" FOREIGN KEY ("schemaId") REFERENCES "training_schemas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_schema_rows" ADD CONSTRAINT "training_schema_rows_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "training_exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_schema_rows" ADD CONSTRAINT "training_schema_rows_rowGroupId_fkey" FOREIGN KEY ("rowGroupId") REFERENCES "training_row_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_row_modifier_assignments" ADD CONSTRAINT "training_row_modifier_assignments_rowId_fkey" FOREIGN KEY ("rowId") REFERENCES "training_schema_rows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_row_modifier_assignments" ADD CONSTRAINT "training_row_modifier_assignments_modifierId_fkey" FOREIGN KEY ("modifierId") REFERENCES "training_modifiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_row_groups" ADD CONSTRAINT "training_row_groups_schemaId_fkey" FOREIGN KEY ("schemaId") REFERENCES "training_schemas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_one_rm_records" ADD CONSTRAINT "training_one_rm_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_one_rm_records" ADD CONSTRAINT "training_one_rm_records_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "training_exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_performed_sessions" ADD CONSTRAINT "training_performed_sessions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "training_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_performed_sessions" ADD CONSTRAINT "training_performed_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_benchmark_results" ADD CONSTRAINT "training_benchmark_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_benchmark_results" ADD CONSTRAINT "training_benchmark_results_plannedSchemaId_fkey" FOREIGN KEY ("plannedSchemaId") REFERENCES "training_schemas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- CreateIndex (folded from prisma/sql/lms-checks.sql — invariants Prisma DSL can't express)
DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS idx_single_head_coach
    ON "users" (role)
    WHERE role = 'HEAD_COACH';
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE marketing_reviews
    ADD CONSTRAINT chk_review_rating
      CHECK (rating BETWEEN 1 AND 5);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS plan_enrollment_unique_active
  ON lms_plan_enrollments ("planId", "athleteId")
  WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS schemas_block_order
  ON training_schemas ("blockId", "order");
