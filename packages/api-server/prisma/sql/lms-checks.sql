DO $$ BEGIN
  ALTER TABLE lms_set_logs
    ADD CONSTRAINT chk_set_log_rpe
      CHECK ((actual->>'rpe')::numeric IS NULL OR (actual->>'rpe')::numeric BETWEEN 1 AND 10);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE lms_workout_sessions
    ADD CONSTRAINT chk_session_rpe
      CHECK ("perceivedExertion" IS NULL OR "perceivedExertion" BETWEEN 1 AND 10);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE lms_workout_sessions
    ADD CONSTRAINT chk_completion_ratio_range
      CHECK ("completionRatio" IS NULL OR ("completionRatio" >= 0 AND "completionRatio" <= 1));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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

DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS plan_enrollment_unique_active
    ON lms_plan_enrollments ("planId", "athleteId")
    WHERE "deletedAt" IS NULL;
EXCEPTION WHEN others THEN NULL;
END $$;
