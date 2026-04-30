import { type z } from "zod";

import { type tonnageByPatternSchema, type weeklyVolumeSchema } from "./weekly-volume.schema";

export type WeeklyVolume = z.infer<typeof weeklyVolumeSchema>;
export type TonnageByPattern = z.infer<typeof tonnageByPatternSchema>;
