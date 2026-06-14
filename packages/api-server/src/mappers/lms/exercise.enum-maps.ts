import { ExerciseNature as PrismaExerciseNature } from "@prisma/client";

import { type ExerciseNature } from "@repo/contracts/lms/exercise";

export const NATURE_MAP: Record<PrismaExerciseNature, ExerciseNature> = {
  CONCRETE: "CONCRETE",
  PLACEHOLDER: "PLACEHOLDER",
  REST: "REST",
};

export const natureToPrisma: Record<ExerciseNature, PrismaExerciseNature> = {
  CONCRETE: PrismaExerciseNature.CONCRETE,
  PLACEHOLDER: PrismaExerciseNature.PLACEHOLDER,
  REST: PrismaExerciseNature.REST,
};
