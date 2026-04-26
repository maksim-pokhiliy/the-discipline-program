import { z } from "zod";

export const exerciseCompositionSchema = z.object({
  exerciseId: z.string().cuid(),
  reps: z.number().int().positive(),
  modifier: z.string().optional(),
});
