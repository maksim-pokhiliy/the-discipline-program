import { z } from "zod";

const tempoPositionSchema = z.union([z.number().int().min(0).max(60), z.literal("X")]);

export const fullTempoSchema = z.object({
  eccentric: tempoPositionSchema,
  pauseBottom: tempoPositionSchema,
  concentric: tempoPositionSchema,
  pauseTop: tempoPositionSchema,
});

export const tempoModifierSchema = fullTempoSchema;

export type FullTempo = z.infer<typeof fullTempoSchema>;
export type TempoModifier = FullTempo;
