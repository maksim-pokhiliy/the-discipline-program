import { type z } from "zod";

import { type benchmarkSourceSchema } from "./benchmark-source.schema";

export type BenchmarkSource = z.infer<typeof benchmarkSourceSchema>;

export const BENCHMARK_SOURCES: readonly BenchmarkSource[] = [
  "MANUAL",
  "DERIVED_FROM_LOG",
] as const;
