import { type Benchmark as PrismaBenchmark } from "@prisma/client";

import { type Benchmark } from "@repo/contracts/lms/benchmark";

import { BENCHMARK_SOURCE_MAP, PR_KIND_MAP } from "./enum-maps";

export const mapToBenchmark = (b: PrismaBenchmark): Benchmark => ({
  id: b.id,
  userId: b.userId,
  exerciseId: b.exerciseId,
  kind: PR_KIND_MAP[b.kind],
  value: b.value.toNumber(),
  unit: b.unit,
  source: BENCHMARK_SOURCE_MAP[b.source],
  setBy: b.setBy,
  setAt: b.setAt,
  notes: b.notes,
});
