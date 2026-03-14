import {
  type ExerciseCategory as PrismaExerciseCategory,
  type WorkoutBlock as PrismaWorkoutBlock,
} from "@prisma/client";

import { type WorkoutBlock } from "@repo/contracts/workout-block";

import { SCORE_TYPE_MAP, SECTION_TYPE_MAP } from "./enum-maps";
import { mapToExerciseCategory } from "./exercise-category.mapper";

type WorkoutBlockWithCategory = PrismaWorkoutBlock & {
  category: PrismaExerciseCategory | null;
};

export const mapToWorkoutBlock = (b: WorkoutBlockWithCategory): WorkoutBlock => ({
  id: b.id,
  workoutId: b.workoutId,
  categoryId: b.categoryId,
  category: b.category ? mapToExerciseCategory(b.category) : null,
  sectionType: SECTION_TYPE_MAP[b.sectionType],
  scoreType: SCORE_TYPE_MAP[b.scoreType],
  title: b.title,
  notes: b.notes,
  rounds: b.rounds,
  timeCapSec: b.timeCapSec,
  intervalSec: b.intervalSec,
  workSec: b.workSec,
  restSec: b.restSec,
  restAfterSec: b.restAfterSec,
  sortOrder: b.sortOrder,
});
