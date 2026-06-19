import { type z } from "zod";

import {
  type benchmarkResultParamsSchema,
  type createBenchmarkResultRequestSchema,
  type createBenchmarkResultResponseSchema,
} from "./benchmark-result-api.schema";

export type BenchmarkResultParams = z.infer<typeof benchmarkResultParamsSchema>;
export type CreateBenchmarkResultRequest = z.infer<typeof createBenchmarkResultRequestSchema>;
export type CreateBenchmarkResultResponse = z.infer<typeof createBenchmarkResultResponseSchema>;
