import {
  type ExerciseCategory as PrismaExerciseCategory,
  type WorkoutBlock as PrismaWorkoutBlock,
} from "@prisma/client";

import { type WorkoutBlock } from "@repo/contracts/workout-block";

import { mapToExerciseCategory } from "./exercise-category.mapper";

type WorkoutBlockWithCategory = PrismaWorkoutBlock & {
  category: PrismaExerciseCategory;
};

export const mapToWorkoutBlock = (b: WorkoutBlockWithCategory): WorkoutBlock => ({
  id: b.id,
  workoutId: b.workoutId,
  categoryId: b.categoryId,
  category: mapToExerciseCategory(b.category),
  rounds: b.rounds,
  timeCapSec: b.timeCapSec,
  sortOrder: b.sortOrder,
});
