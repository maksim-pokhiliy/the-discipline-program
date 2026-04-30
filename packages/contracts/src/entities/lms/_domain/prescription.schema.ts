import { z } from "zod";

import { exerciseCompositionSchema } from "./exercise-composition.schema";
import { loadSpecSchema } from "./load-spec.schema";
import { repSpecSchema } from "./rep-spec.schema";
import { sideModeSchema } from "./side-mode.schema";
import { tempoSpecSchema } from "./tempo-spec.schema";

export const prescriptionSchema = z
  .object({
    reps: repSpecSchema.optional(),
    durationSec: z.number().int().positive().optional(),
    distanceM: z.number().positive().optional(),
    calories: z.number().int().positive().optional(),
    load: loadSpecSchema.optional(),
    tempo: tempoSpecSchema.optional(),
    sideMode: sideModeSchema.default("BILATERAL"),
    composition: z.array(exerciseCompositionSchema).optional(),
    modifiers: z.array(z.string()).default([]),
    scalingNotes: z.string().max(500).optional(),
  })
  .refine(
    (p) =>
      p.reps !== undefined ||
      p.durationSec !== undefined ||
      p.distanceM !== undefined ||
      p.calories !== undefined ||
      p.composition !== undefined,
    {
      message:
        "Prescription must specify at least one of: reps, duration, distance, calories, composition",
    },
  );
