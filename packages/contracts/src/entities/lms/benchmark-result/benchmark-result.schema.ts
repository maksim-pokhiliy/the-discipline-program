import { z } from "zod";

import { resultSchema } from "../_shared";

export const benchmarkResultSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  plannedSchemaId: z.string().cuid(),
  result: resultSchema,
  recordedAt: z.coerce.date(),
  createdAt: z.date(),
});

export const createBenchmarkResultSchema = z.object({
  plannedSchemaId: z.string().cuid(),
  result: resultSchema,
});
