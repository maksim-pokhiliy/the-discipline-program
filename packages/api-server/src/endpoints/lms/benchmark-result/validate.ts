import { type Result, type ResultType } from "@repo/contracts/lms/_shared";
import { compositionSchema } from "@repo/contracts/lms/composition";
import { BadRequestError, NotFoundError } from "@repo/errors";

import { prisma } from "../../../db/client";

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
