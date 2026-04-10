import { type UserBenchmark as PrismaUserBenchmark } from "@prisma/client";

import { type UserBenchmark } from "@repo/contracts/lms/user-benchmark";

export const mapToUserBenchmark = (b: PrismaUserBenchmark): UserBenchmark => ({
  id: b.id,
  userId: b.userId,
  benchmarkDefinitionId: b.benchmarkDefinitionId,
  value: Number(b.value),
  updatedAt: b.updatedAt,
});
