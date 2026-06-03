import { z } from "zod";

export const exactOrRangeSchema = z.union([
  z.number().int().positive(),
  z
    .object({
      min: z.number().int().positive(),
      max: z.number().int().positive(),
    })
    .refine((r) => r.min < r.max, { message: "range.min must be less than range.max" }),
]);

export type ExactOrRange = z.infer<typeof exactOrRangeSchema>;
