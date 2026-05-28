import type { z } from "zod";

import type { Intensity } from "@repo/contracts/lms/_shared";
import type {
  effortPercentSchema,
  numericPaceSchema,
  paceSchema,
} from "@repo/contracts/lms/_shared";

export type EffortPercentInput = z.infer<typeof effortPercentSchema>;
export type PaceValueInput = z.infer<typeof paceSchema>;
export type NumericPaceInput = z.infer<typeof numericPaceSchema>;

export type HrZoneValue = "Z1" | "Z2" | "Z3" | "Z4" | "Z5";

export const effortPercent = (value: EffortPercentInput): Intensity => ({ effortPercent: value });

export const rpe = (value: number): Intensity => ({ rpe: { value } });

export const pace = (value: PaceValueInput): Intensity => ({ pace: value });

export const hrZone = (zone: HrZoneValue): Intensity => ({ hrZone: { zone } });

export const numericPace = (input: NumericPaceInput): Intensity => ({ numericPace: input });
