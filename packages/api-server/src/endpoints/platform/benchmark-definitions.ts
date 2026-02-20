import {
  type BenchmarkDefinition,
  type CreateBenchmarkDefinitionData,
  type UpdateBenchmarkDefinitionData,
} from "@repo/contracts/benchmark-definition";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToBenchmarkDefinition } from "../../mappers";

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
    const definition = await prisma.benchmarkDefinition.create({ data });

    return mapToBenchmarkDefinition(definition);
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

    const definition = await prisma.benchmarkDefinition.update({
      where: { id: definitionId },
      data,
    });

    return mapToBenchmarkDefinition(definition);
  },

  delete: async (definitionId: string): Promise<void> => {
    const existing = await prisma.benchmarkDefinition.findUnique({
      where: { id: definitionId },
    });

    if (!existing) {
      throw new NotFoundError("Benchmark definition not found", { definitionId });
    }

    await prisma.benchmarkDefinition.delete({ where: { id: definitionId } });
  },
};
