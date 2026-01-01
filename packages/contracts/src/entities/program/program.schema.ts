import { z } from "zod";

export const programSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().min(1),
  price: z.number().positive(),
  currency: z.string().length(3),
  features: z.array(z.string()),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createProgramSchema = programSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProgramSchema = createProgramSchema.partial();

export const updateProgramOrderSchema = z.object({
  id: z.string().cuid(),
  sortOrder: z.number().int().min(0),
});

export const updateProgramsOrderSchema = z.array(updateProgramOrderSchema);
