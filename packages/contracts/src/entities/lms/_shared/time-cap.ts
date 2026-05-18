import { z } from "zod";

export const TIME_CAP_UNITS = ["min", "sec"] as const;

export const timeCapSchema = z
  .object({
    min: z.number().positive(),
    max: z.number().positive().optional(),
    unit: z.enum(TIME_CAP_UNITS),
  })
  .refine((v) => v.max === undefined || v.min < v.max, {
    message: "timeCap.max must be > min when set",
  });

export type TimeCap = z.infer<typeof timeCapSchema>;
export type TimeCapUnit = (typeof TIME_CAP_UNITS)[number];
