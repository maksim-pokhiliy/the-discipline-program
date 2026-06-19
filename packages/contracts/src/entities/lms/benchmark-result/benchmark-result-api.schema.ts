import { z } from "zod";

import { benchmarkResultSchema, createBenchmarkResultSchema } from "./benchmark-result.schema";

export const benchmarkResultParamsSchema = z.object({
  sessionId: z.string().cuid(),
});

export const createBenchmarkResultRequestSchema = createBenchmarkResultSchema;

export const createBenchmarkResultResponseSchema = benchmarkResultSchema;
