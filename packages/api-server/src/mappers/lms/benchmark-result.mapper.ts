import { type BenchmarkResult as PrismaBenchmarkResult } from "@prisma/client";

import { resultSchema } from "@repo/contracts/lms/_shared";
import { type BenchmarkResult } from "@repo/contracts/lms/benchmark-result";

export const mapToBenchmarkResult = (p: PrismaBenchmarkResult): BenchmarkResult => ({
  id: p.id,
  userId: p.userId,
  plannedSchemaId: p.plannedSchemaId,
  result: resultSchema.parse(p.result),
  recordedAt: p.recordedAt,
  createdAt: p.createdAt,
});
