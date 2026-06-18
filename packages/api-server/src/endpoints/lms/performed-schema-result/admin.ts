import { type Result, type ResultType } from "@repo/contracts/lms/_shared";
import { compositionSchema } from "@repo/contracts/lms/composition";
import {
  type CreatePerformedSchemaResultData,
  type PerformedSchemaResult,
} from "@repo/contracts/lms/performed-schema-result";
import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { mapToPerformedSchemaResult } from "../../../mappers/lms";
import { handlePrismaError, toInputJson } from "../../../utils";

const loadPerformedSessionForAthlete = async (
  performedSessionId: string,
  userId: string,
): Promise<{ sessionId: string }> => {
  const performedSession = await prisma.performedSession.findUnique({
    where: { id: performedSessionId },
    select: { userId: true, sessionId: true },
  });

  if (!performedSession) {
    throw new NotFoundError("Performed session not found", { performedSessionId });
  }

  if (performedSession.userId !== userId) {
    throw new ForbiddenError("Performed session does not belong to this athlete", {
      performedSessionId,
    });
  }

  return { sessionId: performedSession.sessionId };
};

const loadBenchmarkSchema = async (
  plannedSchemaId: string,
): Promise<{ resultType: ResultType; sessionId: string }> => {
  const schema = await prisma.schema.findUnique({
    where: { id: plannedSchemaId },
    select: { composition: true, block: { select: { sessionId: true } } },
  });

  if (!schema) {
    throw new NotFoundError("Schema not found", { plannedSchemaId });
  }

  const composition =
    schema.composition === null ? null : compositionSchema.parse(schema.composition);

  if (composition === null || composition.benchmark == null) {
    throw new BadRequestError("A result can only be recorded for a benchmark schema", {
      plannedSchemaId,
    });
  }

  return { resultType: composition.benchmark.resultType, sessionId: schema.block.sessionId };
};

export const validateBenchmarkResultForSession = async (
  sessionId: string,
  plannedSchemaId: string,
  result: Result,
): Promise<void> => {
  const { resultType, sessionId: schemaSessionId } = await loadBenchmarkSchema(plannedSchemaId);

  if (schemaSessionId !== sessionId) {
    throw new BadRequestError("Schema does not belong to the performed session", {
      sessionId,
      plannedSchemaId,
    });
  }

  if (result.type !== resultType) {
    throw new BadRequestError("Result type does not match the benchmark result type", {
      expected: resultType,
      received: result.type,
    });
  }
};

export const lmsPerformedSchemaResultApi = {
  create: async (
    userId: string,
    performedSessionId: string,
    data: CreatePerformedSchemaResultData,
  ): Promise<PerformedSchemaResult> => {
    const { sessionId } = await loadPerformedSessionForAthlete(performedSessionId, userId);

    await validateBenchmarkResultForSession(sessionId, data.plannedSchemaId, data.result);

    try {
      const result = await prisma.performedSchemaResult.create({
        data: {
          performedSessionId,
          plannedSchemaId: data.plannedSchemaId,
          result: toInputJson(data.result),
        },
      });

      return mapToPerformedSchemaResult(result);
    } catch (error) {
      return handlePrismaError(error, { entity: "Performed schema result" });
    }
  },
};
