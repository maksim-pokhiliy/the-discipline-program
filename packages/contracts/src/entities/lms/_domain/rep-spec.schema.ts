import { z } from "zod";

export const repSpecKindSchema = z.enum(["FIXED", "RANGE", "EACH_SIDE", "AMRAP_REPS", "MAX"]);

export const repSpecSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("FIXED"), value: z.number().int().positive() }),
  z.object({
    kind: z.literal("RANGE"),
    min: z.number().int().positive(),
    max: z.number().int().positive(),
  }),
  z.object({ kind: z.literal("EACH_SIDE"), value: z.number().int().positive() }),
  z.object({ kind: z.literal("AMRAP_REPS") }),
  z.object({ kind: z.literal("MAX") }),
]);
