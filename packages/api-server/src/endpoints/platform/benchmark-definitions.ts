import {
  type BenchmarkDefinition,
  type CreateBenchmarkDefinitionData,
  type UpdateBenchmarkDefinitionData,
} from "@repo/contracts/benchmark-definition";
import { ConflictError, NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToBenchmarkDefinition } from "../../mappers";
import { handlePrismaError } from "../../utils";

export const platformBenchmarkDefinitionsApi = {
  getAll: async (): Promise<BenchmarkDefinition[]> => {
    const definitions = await prisma.benchmarkDefinition.findMany({
      orderBy: { name: "asc" },
    });

    return definitions.map(mapToBenchmarkDefinition);
  },

  getById: async (definitionId: string): Promise<BenchmarkDefinition> => {
    const definition = await prisma.benchmarkDefinition.findUnique({
      where: { id: definitionId },
    });

    if (!definition) {
      throw new NotFoundError("Benchmark definition not found", { definitionId });
    }

    return mapToBenchmarkDefinition(definition);
  },

  create: async (data: CreateBenchmarkDefinitionData): Promise<BenchmarkDefinition> => {
    try {
      const definition = await prisma.benchmarkDefinition.create({ data });

      return mapToBenchmarkDefinition(definition);
    } catch (error) {
      return handlePrismaError(error, { entity: "Benchmark definition", field: "name" });
    }
  },

  update: async (
    definitionId: string,
    data: UpdateBenchmarkDefinitionData,
  ): Promise<BenchmarkDefinition> => {
    const existing = await prisma.benchmarkDefinition.findUnique({
      where: { id: definitionId },
    });

    if (!existing) {
      throw new NotFoundError("Benchmark definition not found", { definitionId });
    }

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

  delete: async (definitionId: string): Promise<void> => {
    const existing = await prisma.benchmarkDefinition.findUnique({
      where: { id: definitionId },
    });

    if (!existing) {
      throw new NotFoundError("Benchmark definition not found", { definitionId });
    }

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
      handlePrismaError(error, { entity: "Benchmark definition" });
    }
  },
};
