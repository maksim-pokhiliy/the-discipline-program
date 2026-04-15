import { z } from "zod";

export const moneySchema = z.object({
  amountCents: z.number().int(),
  currency: z.string().min(3).max(3),
});

export type Money = z.infer<typeof moneySchema>;
