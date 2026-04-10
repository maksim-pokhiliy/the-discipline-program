import { z } from "zod";

import {
  createUserBenchmarkSchema,
  updateUserBenchmarkSchema,
  userBenchmarkSchema,
} from "./user-benchmark.schema";

const benchmarkIdParamSchema = z.object({ benchmarkId: z.string().cuid() });

export const getUserBenchmarksParamsSchema = z.object({
  userId: z.string().cuid(),
});

export const getUserBenchmarksResponseSchema = z.array(userBenchmarkSchema);

export const getUserBenchmarkByIdParamsSchema = benchmarkIdParamSchema;

export const getUserBenchmarkResponseSchema = userBenchmarkSchema;

export const createUserBenchmarkRequestSchema = createUserBenchmarkSchema;

export const createUserBenchmarkResponseSchema = userBenchmarkSchema;

export const updateUserBenchmarkParamsSchema = benchmarkIdParamSchema;

export const updateUserBenchmarkRequestSchema = updateUserBenchmarkSchema;

export const updateUserBenchmarkResponseSchema = userBenchmarkSchema;

export const deleteUserBenchmarkParamsSchema = benchmarkIdParamSchema;
