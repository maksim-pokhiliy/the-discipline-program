import { type z } from "zod";

import {
  type benchmarkIdParamSchema,
  type createBenchmarkInputSchema,
  type createBenchmarkResponseSchema,
  type getBenchmarkResponseSchema,
  type listBenchmarksQuerySchema,
  type listBenchmarksResponseSchema,
  type updateBenchmarkInputSchema,
  type updateBenchmarkResponseSchema,
} from "./benchmark-api.schema";

export type CreateBenchmarkInput = z.infer<typeof createBenchmarkInputSchema>;
export type UpdateBenchmarkInput = z.infer<typeof updateBenchmarkInputSchema>;
export type BenchmarkIdParam = z.infer<typeof benchmarkIdParamSchema>;
export type ListBenchmarksQuery = z.infer<typeof listBenchmarksQuerySchema>;
export type ListBenchmarksResponse = z.infer<typeof listBenchmarksResponseSchema>;
export type GetBenchmarkResponse = z.infer<typeof getBenchmarkResponseSchema>;
export type CreateBenchmarkResponse = z.infer<typeof createBenchmarkResponseSchema>;
export type UpdateBenchmarkResponse = z.infer<typeof updateBenchmarkResponseSchema>;
