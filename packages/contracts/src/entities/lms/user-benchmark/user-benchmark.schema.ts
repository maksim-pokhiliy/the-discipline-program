import { z } from "zod";

export const userBenchmarkSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  benchmarkDefinitionId: z.string().cuid(),
  value: z.number().finite().nonnegative(),
  updatedAt: z.date(),
});

export const createUserBenchmarkSchema = z.object({
  benchmarkDefinitionId: z.string().cuid(),
  value: z.number().finite().nonnegative(),
});

export const updateUserBenchmarkSchema = z.object({
  value: z.number().finite().nonnegative(),
});
