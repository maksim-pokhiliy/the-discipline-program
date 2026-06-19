import { type z } from "zod";

import {
  type benchmarkResultSchema,
  type createBenchmarkResultSchema,
} from "./benchmark-result.schema";

export type BenchmarkResult = z.infer<typeof benchmarkResultSchema>;
export type CreateBenchmarkResultData = z.infer<typeof createBenchmarkResultSchema>;
