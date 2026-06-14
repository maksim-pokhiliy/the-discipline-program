import { z } from "zod";

const tempoPositionSchema = z.union([z.number().int().min(0).max(60), z.literal("X")]);

export const fullTempoSchema = z.object({
  eccentric: tempoPositionSchema,
  pauseBottom: tempoPositionSchema,
  concentric: tempoPositionSchema,
  pauseTop: tempoPositionSchema,
});

const TEMPO_FREE_MAX_LENGTH = 80;

const tempoFreeSchema = z.string().trim().min(1).max(TEMPO_FREE_MAX_LENGTH);

export const tempoModifierSchema = z.union([fullTempoSchema, tempoFreeSchema]);

export type FullTempo = z.infer<typeof fullTempoSchema>;
export type TempoModifier = z.infer<typeof tempoModifierSchema>;
