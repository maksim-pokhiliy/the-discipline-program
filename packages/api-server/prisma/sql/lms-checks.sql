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
