import { type PercentageReference } from "@repo/contracts/lms/_shared";
import { type Exercise } from "@repo/contracts/lms/exercise";

export type ExerciseById = ReadonlyMap<string, Exercise>;

const OF_PREFIX = "of ";
const ONE_RM_SUFFIX = " 1RM";
const SELF_LABEL = "of 1RM";
const UNKNOWN_EXERCISE_FALLBACK = "—";

export const formatPercentageReference = (
  reference: PercentageReference,
  exerciseById: ExerciseById,
): string => {
  switch (reference.scope) {
    case "self":
      return SELF_LABEL;
    case "movement_family":
      return `${OF_PREFIX}${reference.movementFamily}${ONE_RM_SUFFIX}`;
    case "other_exercise": {
      const exercise = exerciseById.get(reference.targetExerciseId);
      const name = exercise?.canonicalName ?? UNKNOWN_EXERCISE_FALLBACK;

      return `${OF_PREFIX}${name}${ONE_RM_SUFFIX}`;
    }
    default:
      reference satisfies never;

      return "";
  }
};
