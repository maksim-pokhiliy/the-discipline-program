import { z } from "zod";

export const TEMPO_PAUSE_POSITIONS = ["up"] as const;

export const fullTempoSchema = z.object({
  eccentric: z.number().int().min(0).max(60),
  pauseBottom: z.number().int().min(0).max(60),
  concentric: z.number().int().min(0).max(60),
  pauseTop: z.number().int().min(0).max(60),
});

export const tempoModifierSchema = z
  .object({
    pauseInUp: z
      .object({
        durationSec: z.number().positive(),
        position: z.enum(TEMPO_PAUSE_POSITIONS).optional(),
      })
      .optional(),
    perNthRepPause: z
      .object({
        everyN: z.number().int().positive(),
        pauseSec: z.number().positive(),
      })
      .optional(),
    slowEccentric: z.object({ durationSec: z.number().positive() }).optional(),
    holdAfterLast: z.object({ durationSec: z.number().positive() }).optional(),
    fullTempo: fullTempoSchema.optional(),
  })
  .refine(
    (t) =>
      t.pauseInUp !== undefined ||
      t.perNthRepPause !== undefined ||
      t.slowEccentric !== undefined ||
      t.holdAfterLast !== undefined ||
      t.fullTempo !== undefined,
    { message: "tempoModifier must set at least one field" },
  );

export type TempoModifier = z.infer<typeof tempoModifierSchema>;
export type FullTempo = z.infer<typeof fullTempoSchema>;
export type TempoPausePosition = (typeof TEMPO_PAUSE_POSITIONS)[number];
