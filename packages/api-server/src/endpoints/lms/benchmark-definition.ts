import {
  type BenchmarkDefinition,
  type CreateBenchmarkDefinitionData,
  type UpdateBenchmarkDefinitionData,
} from "@repo/contracts/lms/benchmark-definition";
import { ConflictError } from "@repo/errors";

import { resolveCoachId } from "../../authz/guards";
import { prisma } from "../../db/client";
import { mapToBenchmarkDefinition } from "../../mappers";
import { findOrThrow, handlePrismaError } from "../../utils";

export const platformBenchmarkDefinitionsApi = {
  getAll: async (): Promise<BenchmarkDefinition[]> => {
    const definitions = await prisma.benchmarkDefinition.findMany({
      orderBy: { name: "asc" },
    });

    return definitions.map(mapToBenchmarkDefinition);
  },

  getById: async (definitionId: string): Promise<BenchmarkDefinition> => {
    const definition = await findOrThrow(
      prisma.benchmarkDefinition.findUnique({ where: { id: definitionId } }),
      "Benchmark definition",
    );

    return mapToBenchmarkDefinition(definition);
  },

  create: async (
    userId: string,
    data: CreateBenchmarkDefinitionData,
  ): Promise<BenchmarkDefinition> => {
    await resolveCoachId(userId);

    try {
      const definition = await prisma.benchmarkDefinition.create({ data });

      return mapToBenchmarkDefinition(definition);
    } catch (error) {
      return handlePrismaError(error, { entity: "Benchmark definition", field: "name" });
    }
  },

  update: async (
    userId: string,
    definitionId: string,
    data: UpdateBenchmarkDefinitionData,
  ): Promise<BenchmarkDefinition> => {
    await resolveCoachId(userId);

    await findOrThrow(
      prisma.benchmarkDefinition.findUnique({ where: { id: definitionId } }),
      "Benchmark definition",
    );

    try {
      const definition = await prisma.benchmarkDefinition.update({
        where: { id: definitionId },
        data,
      });

      return mapToBenchmarkDefinition(definition);
    } catch (error) {
      return handlePrismaError(error, { entity: "Benchmark definition", field: "name" });
    }
  },

  delete: async (userId: string, definitionId: string): Promise<void> => {
    await resolveCoachId(userId);

    await findOrThrow(
      prisma.benchmarkDefinition.findUnique({ where: { id: definitionId } }),
      "Benchmark definition",
    );

    const usageCount = await prisma.userBenchmark.count({
      where: { benchmarkDefinitionId: definitionId },
    });

    if (usageCount > 0) {
      throw new ConflictError(
        `Cannot delete benchmark definition with ${usageCount} user benchmark(s). Remove them first.`,
        { definitionId, usageCount },
      );
    }

    try {
      await prisma.benchmarkDefinition.delete({ where: { id: definitionId } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Benchmark definition" });
    }
  },
};
