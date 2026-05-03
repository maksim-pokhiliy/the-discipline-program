import { type Prisma } from "@prisma/client";

import { UserRole } from "@repo/contracts/iam/auth";
import {
  type CreateBenchmarkInput,
  type ListBenchmarksQuery,
  type UpdateBenchmarkInput,
} from "@repo/contracts/lms/benchmark";
import { ForbiddenError } from "@repo/errors";

import { requireCoachLikeRole } from "../../authz/guards";
import { prisma } from "../../db/client";
import {
  BENCHMARK_SOURCE_TO_PRISMA_MAP,
  mapToBenchmark,
  PR_KIND_TO_PRISMA_MAP,
} from "../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../utils";
import { DEFAULT_LIST_LIMIT } from "../../utils/list-limits";

const ensureCanReadOrWriteForUser = (
  role: UserRole,
  callerId: string,
  targetUserId: string,
): void => {
  if (callerId === targetUserId) {
    return;
  }

  if (role === UserRole.ADMIN || role === UserRole.HEAD_COACH) {
    return;
  }

  throw new ForbiddenError("Benchmark belongs to another user");
};

export const lmsBenchmarkApi = {
  list: async (userId: string, query: ListBenchmarksQuery) => {
    const role = await requireCoachLikeRole(userId);

    if (query.userId) {
      ensureCanReadOrWriteForUser(role, userId, query.userId);
    }

    const where: Prisma.BenchmarkWhereInput = {
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.kind ? { kind: PR_KIND_TO_PRISMA_MAP[query.kind] } : {}),
    };

    const take = query.take ?? DEFAULT_LIST_LIMIT;

    const [total, items] = await prisma.$transaction([
      prisma.benchmark.count({ where }),
      prisma.benchmark.findMany({
        where,
        orderBy: { setAt: "desc" },
        take,
      }),
    ]);

    return { items: items.map(mapToBenchmark), total };
  },

  getById: async (userId: string, benchmarkId: string) => {
    const role = await requireCoachLikeRole(userId);

    const record = await findOrThrow(
      prisma.benchmark.findUnique({ where: { id: benchmarkId } }),
      "Benchmark",
    );

    ensureCanReadOrWriteForUser(role, userId, record.userId);

    return mapToBenchmark(record);
  },

  create: async (userId: string, data: CreateBenchmarkInput) => {
    const role = await requireCoachLikeRole(userId);

    ensureCanReadOrWriteForUser(role, userId, data.userId);

    try {
      const record = await prisma.benchmark.create({
        data: {
          userId: data.userId,
          kind: PR_KIND_TO_PRISMA_MAP[data.kind],
          value: data.value,
          unit: data.unit,
          source: BENCHMARK_SOURCE_TO_PRISMA_MAP[data.source],
          setBy: userId,
          notes: data.notes ?? null,
        },
      });

      return mapToBenchmark(record);
    } catch (error) {
      return handlePrismaError(error, { entity: "Benchmark" });
    }
  },

  update: async (userId: string, benchmarkId: string, data: UpdateBenchmarkInput) => {
    const role = await requireCoachLikeRole(userId);

    const existing = await findOrThrow(
      prisma.benchmark.findUnique({ where: { id: benchmarkId } }),
      "Benchmark",
    );

    ensureCanReadOrWriteForUser(role, userId, existing.userId);

    try {
      const record = await prisma.benchmark.update({
        where: { id: benchmarkId },
        data: {
          ...(data.value !== undefined ? { value: data.value } : {}),
          ...(data.unit ? { unit: data.unit } : {}),
          ...(data.source ? { source: BENCHMARK_SOURCE_TO_PRISMA_MAP[data.source] } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
          setBy: userId,
          setAt: new Date(),
        },
      });

      return mapToBenchmark(record);
    } catch (error) {
      return handlePrismaError(error, { entity: "Benchmark" });
    }
  },

  delete: async (userId: string, benchmarkId: string): Promise<void> => {
    const role = await requireCoachLikeRole(userId);

    const existing = await findOrThrow(
      prisma.benchmark.findUnique({ where: { id: benchmarkId } }),
      "Benchmark",
    );

    ensureCanReadOrWriteForUser(role, userId, existing.userId);

    try {
      await prisma.benchmark.delete({ where: { id: benchmarkId } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Benchmark" });
    }
  },
};
