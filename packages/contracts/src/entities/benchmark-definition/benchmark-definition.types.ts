import { type z } from "zod";

import {
  type benchmarkDefinitionSchema,
  type createBenchmarkDefinitionSchema,
  type updateBenchmarkDefinitionSchema,
} from "./benchmark-definition.schema";

export type BenchmarkDefinition = z.infer<typeof benchmarkDefinitionSchema>;
export type CreateBenchmarkDefinitionData = z.infer<typeof createBenchmarkDefinitionSchema>;
export type UpdateBenchmarkDefinitionData = z.infer<typeof updateBenchmarkDefinitionSchema>;
