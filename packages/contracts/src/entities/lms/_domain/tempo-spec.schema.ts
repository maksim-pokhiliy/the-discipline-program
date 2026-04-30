import { z } from "zod";

export const tempoSpecSchema = z.object({
  pauseUpSec: z.number().int().nonnegative().optional(),
  pauseDownSec: z.number().int().nonnegative().optional(),
  pauseEveryNthRep: z
    .object({
      n: z.number().int().positive(),
      seconds: z.number().int().positive(),
    })
    .optional(),
  tempoString: z
    .string()
    .regex(/^\d+-\d+-(\d+|X)-\d+$/u)
    .optional(),
});
