import { type BenchmarkDefinition as PrismaBenchmarkDefinition } from "@prisma/client";

import { type BenchmarkDefinition } from "@repo/contracts/benchmark-definition";

export const mapToBenchmarkDefinition = (d: PrismaBenchmarkDefinition): BenchmarkDefinition => ({
  id: d.id,
  name: d.name,
  unit: d.unit,
  category: d.category,
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
});
