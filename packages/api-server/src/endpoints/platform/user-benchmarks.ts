import {
  type CreateUserBenchmarkData,
  type UpdateUserBenchmarkData,
  type UserBenchmark,
} from "@repo/contracts/user-benchmark";
import { ForbiddenError, NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToUserBenchmark } from "../../mappers";

import { resolveCoachId, verifyAthleteBelongsToCoach } from "./guards";

const verifyAccessToUser = async (authUserId: string, targetUserId: string): Promise<void> => {
  if (authUserId === targetUserId) {
    return;
  }

  const coachId = await resolveCoachId(authUserId);

  await verifyAthleteBelongsToCoach(targetUserId, coachId);
};

export const platformUserBenchmarksApi = {
  getByUser: async (authUserId: string, targetUserId: string): Promise<UserBenchmark[]> => {
    await verifyAccessToUser(authUserId, targetUserId);

    const benchmarks = await prisma.userBenchmark.findMany({
      where: { userId: targetUserId },
      orderBy: { updatedAt: "desc" },
    });

    return benchmarks.map(mapToUserBenchmark);
  },

  create: async (
    authUserId: string,
    targetUserId: string,
    data: CreateUserBenchmarkData,
  ): Promise<UserBenchmark> => {
    await verifyAccessToUser(authUserId, targetUserId);

    const benchmark = await prisma.userBenchmark.create({
      data: { userId: targetUserId, ...data },
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
