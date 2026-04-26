import { z } from "zod";

export const restSpecKindSchema = z.enum(["FIXED", "RANGE", "UNTIL_RECOVERY", "AFTER_NTH_SET"]);

export const restSpecSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("FIXED"), seconds: z.number().int().positive() }),
  z.object({
    kind: z.literal("RANGE"),
    minSeconds: z.number().int().positive(),
    maxSeconds: z.number().int().positive(),
  }),
  z.object({ kind: z.literal("UNTIL_RECOVERY") }),
  z.object({
    kind: z.literal("AFTER_NTH_SET"),
    n: z.number().int().positive(),
    seconds: z.number().int().positive(),
  }),
]);
