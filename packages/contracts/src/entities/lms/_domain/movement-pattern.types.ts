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

export const MOVEMENT_PATTERN_LABELS: Record<MovementPattern, string> = {
  SQUAT: "Squat",
  HINGE: "Hinge",
  PUSH_VERTICAL: "Vertical Push",
  PUSH_HORIZONTAL: "Horizontal Push",
  PULL_VERTICAL: "Vertical Pull",
  PULL_HORIZONTAL: "Horizontal Pull",
  LUNGE: "Lunge",
  CARRY: "Carry",
  ROTATION: "Rotation",
  CORE_FLEXION: "Core Flexion",
  CORE_EXTENSION: "Core Extension",
  CORE_ANTI: "Core Anti-Rotation",
  CARDIO_RUN: "Cardio — Run",
  CARDIO_BIKE: "Cardio — Bike",
  CARDIO_ROW: "Cardio — Row",
  CARDIO_OTHER: "Cardio — Other",
  GYMNASTIC_HOLD: "Gymnastic Hold",
  GYMNASTIC_INVERTED: "Gymnastic Inverted",
  EXPLOSIVE: "Explosive",
  COMBO: "Combo",
};

export const MOVEMENT_PATTERN_OPTIONS: ReadonlyArray<{ value: MovementPattern; label: string }> =
  MOVEMENT_PATTERNS.map((value) => ({ value, label: MOVEMENT_PATTERN_LABELS[value] }));
