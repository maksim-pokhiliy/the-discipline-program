import {
  type CreateUserBenchmarkData,
  type UpdateUserBenchmarkData,
  type UserBenchmark,
} from "@repo/contracts/user-benchmark";
import { ForbiddenError, NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToUserBenchmark } from "../../mappers";

export const platformUserBenchmarksApi = {
  getByUser: async (userId: string): Promise<UserBenchmark[]> => {
    const benchmarks = await prisma.userBenchmark.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    return benchmarks.map(mapToUserBenchmark);
  },

  create: async (userId: string, data: CreateUserBenchmarkData): Promise<UserBenchmark> => {
    const benchmark = await prisma.userBenchmark.create({
      data: { userId, ...data },
    });

    return mapToUserBenchmark(benchmark);
  },

  update: async (
    userId: string,
    benchmarkId: string,
    data: UpdateUserBenchmarkData,
  ): Promise<UserBenchmark> => {
    const existing = await prisma.userBenchmark.findUnique({
      where: { id: benchmarkId },
    });

    if (!existing) {
      throw new NotFoundError("User benchmark not found", { benchmarkId });
    }

    if (existing.userId !== userId) {
      throw new ForbiddenError("Benchmark does not belong to this user");
    }

    const benchmark = await prisma.userBenchmark.update({
      where: { id: benchmarkId },
      data,
    });

    return mapToUserBenchmark(benchmark);
  },

  delete: async (userId: string, benchmarkId: string): Promise<void> => {
    const existing = await prisma.userBenchmark.findUnique({
      where: { id: benchmarkId },
    });

    if (!existing) {
      throw new NotFoundError("User benchmark not found", { benchmarkId });
    }

    if (existing.userId !== userId) {
      throw new ForbiddenError("Benchmark does not belong to this user");
    }

    await prisma.userBenchmark.delete({ where: { id: benchmarkId } });
  },
};
