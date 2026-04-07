import {
  type CreateUserBenchmarkData,
  type UpdateUserBenchmarkData,
  type UserBenchmark,
} from "@repo/contracts/user-benchmark";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToUserBenchmark } from "../../mappers";
import { handlePrismaError } from "../../utils";

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

    try {
      const benchmark = await prisma.userBenchmark.create({
        data: { userId: targetUserId, ...data },
      });

      return mapToUserBenchmark(benchmark);
    } catch (error) {
      return handlePrismaError(error, { entity: "User benchmark" });
    }
  },

  update: async (
    authUserId: string,
    benchmarkId: string,
    data: UpdateUserBenchmarkData,
  ): Promise<UserBenchmark> => {
    const existing = await prisma.userBenchmark.findUnique({
      where: { id: benchmarkId },
    });

    if (!existing) {
      throw new NotFoundError("User benchmark not found", { benchmarkId });
    }

    await verifyAccessToUser(authUserId, existing.userId);

    try {
      const benchmark = await prisma.userBenchmark.update({
        where: { id: benchmarkId },
        data,
      });

      return mapToUserBenchmark(benchmark);
    } catch (error) {
      return handlePrismaError(error, { entity: "User benchmark" });
    }
  },

  delete: async (authUserId: string, benchmarkId: string): Promise<void> => {
    const existing = await prisma.userBenchmark.findUnique({
      where: { id: benchmarkId },
    });

    if (!existing) {
      throw new NotFoundError("User benchmark not found", { benchmarkId });
    }

    await verifyAccessToUser(authUserId, existing.userId);

    try {
      await prisma.userBenchmark.delete({ where: { id: benchmarkId } });
    } catch (error) {
      handlePrismaError(error, { entity: "User benchmark" });
    }
  },
};
