import {
  type BenchmarkResult,
  type CreateBenchmarkResultData,
} from "@repo/contracts/lms/benchmark-result";
import { OneRMRecordSource } from "@repo/contracts/lms/one-rm-record";
import { BadRequestError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { mapToBenchmarkResult, ONE_RM_RECORD_SOURCE_TO_PRISMA_MAP } from "../../../mappers/lms";
import { handlePrismaError, retryOnP2034, toInputJson } from "../../../utils";
import { assertSessionReachableByAthlete } from "../_shared";

import { validateBenchmarkResultForSession } from "./validate";

const resolveBenchmarkExerciseId = async (plannedSchemaId: string): Promise<string> => {
  const row = await prisma.schemaRow.findFirst({
    where: { schemaId: plannedSchemaId },
    orderBy: { order: "asc" },
    select: { exerciseId: true },
  });

  if (row === null) {
    throw new BadRequestError("A load benchmark must reference a movement", { plannedSchemaId });
  }

  return row.exerciseId;
};

export const lmsBenchmarkResultApi = {
  logBenchmarkResult: async (
    userId: string,
    sessionId: string,
    data: CreateBenchmarkResultData,
  ): Promise<BenchmarkResult> => {
    await assertSessionReachableByAthlete(sessionId, userId);
    await validateBenchmarkResultForSession(sessionId, data.plannedSchemaId, data.result);

    const { result } = data;
    const exerciseId =
      result.type === "load" ? await resolveBenchmarkExerciseId(data.plannedSchemaId) : null;

    try {
      return await retryOnP2034(() =>
        prisma.$transaction(async (tx) => {
          const recordedAt = new Date();

          const created = await tx.benchmarkResult.create({
            data: {
              userId,
              plannedSchemaId: data.plannedSchemaId,
              result: toInputJson(result),
              recordedAt,
            },
          });

          if (result.type === "load" && exerciseId !== null) {
            await tx.oneRMRecord.create({
              data: {
                userId,
                exerciseId,
                valueKg: result.kg,
                recordedAt,
                source: ONE_RM_RECORD_SOURCE_TO_PRISMA_MAP[OneRMRecordSource.MANUAL],
              },
            });
          }

          return mapToBenchmarkResult(created);
        }),
      );
    } catch (error) {
      return handlePrismaError(error, { entity: "Benchmark result" });
    }
  },
};
