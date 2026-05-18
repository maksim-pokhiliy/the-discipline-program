import { z } from "zod";

export const HR_ZONES = ["Z1", "Z2", "Z3", "Z4", "Z5"] as const;
export const NUMERIC_PACE_DISTANCE_UNITS = ["km", "mi", "m", "yd", "lap"] as const;
export const NUMERIC_PACE_TYPES = ["min_per_distance", "distance_per_min"] as const;
export const PACE_VALUES = ["easy", "moderate", "hard", "recovery"] as const;

export const effortPercentSchema = z.union([
  z.object({ value: z.number().positive().max(100) }),
  z.object({
    range: z
      .object({
        min: z.number().positive().max(100),
        max: z.number().positive().max(100),
      })
      .refine((r) => r.min < r.max, { message: "range.min must be < range.max" }),
  }),
]);

export const rpeSchema = z.object({ value: z.number().positive().max(10) });

export const hrZoneSchema = z.object({
  zone: z.enum(HR_ZONES),
});

export const numericPaceSchema = z.object({
  value: z.string().min(1),
  distanceUnit: z.enum(NUMERIC_PACE_DISTANCE_UNITS),
  paceType: z.enum(NUMERIC_PACE_TYPES),
});

export const paceSchema = z.enum(PACE_VALUES);

export const intensitySchema = z
  .object({
    effortPercent: effortPercentSchema.optional(),
    rpe: rpeSchema.optional(),
    pace: paceSchema.optional(),
    hrZone: hrZoneSchema.optional(),
    numericPace: numericPaceSchema.optional(),
  })
  .refine(
    (v) =>
      v.effortPercent !== undefined ||
      v.rpe !== undefined ||
      v.pace !== undefined ||
      v.hrZone !== undefined ||
      v.numericPace !== undefined,
    { message: "intensity must set at least one dimension" },
  );

export type Intensity = z.infer<typeof intensitySchema>;
export type EffortPercent = z.infer<typeof effortPercentSchema>;
export type HrZoneIntensity = z.infer<typeof hrZoneSchema>;
export type NumericPaceIntensity = z.infer<typeof numericPaceSchema>;
export type PaceValue = z.infer<typeof paceSchema>;
export type RpeIntensity = z.infer<typeof rpeSchema>;
