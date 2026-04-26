import { type z } from "zod";

import { type modalitySchema } from "./modality.schema";

export type Modality = z.infer<typeof modalitySchema>;

export const MODALITIES: readonly Modality[] = [
  "BARBELL",
  "DUMBBELL",
  "KETTLEBELL",
  "BODYWEIGHT",
  "CARDIO",
  "BANDED",
  "MIXED",
  "MACHINE",
] as const;
