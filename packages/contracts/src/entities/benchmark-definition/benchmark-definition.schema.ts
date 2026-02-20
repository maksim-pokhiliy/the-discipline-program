import { z } from "zod";

export const benchmarkDefinitionSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(200),
  unit: z.string().min(1).max(50),
  category: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createBenchmarkDefinitionSchema = z.object({
  name: z.string().min(1).max(200),
  unit: z.string().min(1).max(50),
  category: z.string().max(100).nullable().optional(),
});

export const updateBenchmarkDefinitionSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  unit: z.string().min(1).max(50).optional(),
  category: z.string().max(100).nullable().optional(),
});
