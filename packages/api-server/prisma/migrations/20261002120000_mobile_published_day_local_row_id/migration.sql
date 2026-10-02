-- SetLockTimeout
SET LOCAL lock_timeout = '5s';

-- AlterTable
ALTER TABLE "app_mobile_publish_links" ALTER COLUMN "connectionId" DROP NOT NULL;

-- AlterTable
CREATE SEQUENCE app_mobile_published_days_legacyrowid_seq;
ALTER TABLE "app_mobile_published_days" ALTER COLUMN "legacyRowId" SET DEFAULT nextval('app_mobile_published_days_legacyrowid_seq');
ALTER SEQUENCE app_mobile_published_days_legacyrowid_seq OWNED BY "app_mobile_published_days"."legacyRowId";

SELECT setval('app_mobile_published_days_legacyrowid_seq', 1000000, false);
