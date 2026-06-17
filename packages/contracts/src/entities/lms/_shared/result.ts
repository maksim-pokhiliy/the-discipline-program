import { z } from "zod";

export const RESULT_TYPES = [
  "time",
  "rounds_reps",
  "load",
  "max_reps",
  "distance",
  "calories",
] as const;

export const DISTANCE_UNITS = ["m", "km"] as const;

export const resultSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("time"), seconds: z.number().positive() }),
  z.object({
    type: z.literal("rounds_reps"),
    rounds: z.number().int().nonnegative(),
    reps: z.number().int().nonnegative(),
  }),
  z.object({ type: z.literal("load"), kg: z.number().positive() }),
  z.object({ type: z.literal("max_reps"), reps: z.number().int().positive() }),
  z.object({
    type: z.literal("distance"),
    value: z.number().positive(),
    unit: z.enum(DISTANCE_UNITS),
  }),
  z.object({ type: z.literal("calories"), value: z.number().int().positive() }),
]);

export type Result = z.infer<typeof resultSchema>;
export type ResultType = (typeof RESULT_TYPES)[number];

export const RESULT_DIRECTIONS: Record<ResultType, "lower" | "higher"> = {
  time: "lower",
  rounds_reps: "higher",
  load: "higher",
  max_reps: "higher",
  distance: "higher",
  calories: "higher",
};

export type ResultDirection = (typeof RESULT_DIRECTIONS)[ResultType];
