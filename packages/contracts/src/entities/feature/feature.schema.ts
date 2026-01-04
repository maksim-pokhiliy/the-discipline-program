import { z } from "zod";

export const featureSchema = z
  .object({
    id: z.string().cuid(),
    title: z.string().min(1).max(200),
    description: z.string().min(1),
    iconName: z.string(),
    sortOrder: z.number().int().min(0),
    isActive: z.boolean(),
  })
  .strict();
