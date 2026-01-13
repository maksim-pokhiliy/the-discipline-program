import { z } from "zod";

export const programSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().min(1),
  priceLabel: z.string().nullable(),
  features: z.array(z.string()),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createProgramSchema = programSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProgramSchema = createProgramSchema.partial();
