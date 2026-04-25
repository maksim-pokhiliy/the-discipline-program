ALTER TABLE "app_workout_block_exercises" DROP CONSTRAINT IF EXISTS workout_block_exercise_xor;
ALTER TABLE "app_workout_block_exercises" ADD CONSTRAINT workout_block_exercise_xor CHECK (("sectionId" IS NULL) <> ("emomSlotId" IS NULL));
