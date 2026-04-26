import { type z } from "zod";

import { type movementPatternSchema } from "./movement-pattern.schema";

export type MovementPattern = z.infer<typeof movementPatternSchema>;

export const MOVEMENT_PATTERNS: readonly MovementPattern[] = [
  "SQUAT",
  "HINGE",
  "PUSH_VERTICAL",
  "PUSH_HORIZONTAL",
  "PULL_VERTICAL",
  "PULL_HORIZONTAL",
  "LUNGE",
  "CARRY",
  "ROTATION",
  "CORE_FLEXION",
  "CORE_EXTENSION",
  "CORE_ANTI",
  "CARDIO_RUN",
  "CARDIO_BIKE",
  "CARDIO_ROW",
  "CARDIO_OTHER",
  "GYMNASTIC_HOLD",
  "GYMNASTIC_INVERTED",
  "EXPLOSIVE",
  "COMBO",
] as const;
