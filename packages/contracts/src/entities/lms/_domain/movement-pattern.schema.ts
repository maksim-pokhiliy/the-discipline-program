import { z } from "zod";

export const movementPatternSchema = z.enum([
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
]);
