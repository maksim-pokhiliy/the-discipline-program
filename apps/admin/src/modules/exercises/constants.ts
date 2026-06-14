import { type ExerciseNature } from "@repo/contracts/lms/exercise";

export const NATURE_LABELS: Record<ExerciseNature, string> = {
  CONCRETE: "Concrete",
  PLACEHOLDER: "Placeholder",
  REST: "Rest",
};
