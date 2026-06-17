import { compositionSchema } from "@repo/contracts/lms/composition";
import {
  type CreatePerformedSchemaResultData,
  type PerformedSchemaResult,
} from "@repo/contracts/lms/performed-schema-result";
import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { mapToPerformedSchemaResult } from "../../../mappers/lms";
import { handlePrismaError, toInputJson } from "../../../utils";

const verifyPerformedSessionOwnership = async (
  performedSessionId: string,
  userId: string,
): Promise<void> => {
  const performedSession = await prisma.performedSession.findUnique({
    where: { id: performedSessionId },
    select: { userId: true },
  });

  if (!performedSession) {
    throw new NotFoundError("Performed session not found", { performedSessionId });
  }

  if (performedSession.userId !== userId) {
    throw new ForbiddenError("Performed session does not belong to this athlete", {
      performedSessionId,
    });
  }
};

const assertSchemaIsBenchmark = async (plannedSchemaId: string): Promise<void> => {
  const schema = await prisma.schema.findUnique({
    where: { id: plannedSchemaId },
    select: { composition: true },
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
};

export const lmsPerformedSchemaResultApi = {
  create: async (
    userId: string,
    performedSessionId: string,
    data: CreatePerformedSchemaResultData,
  ): Promise<PerformedSchemaResult> => {
    await verifyPerformedSessionOwnership(performedSessionId, userId);
    await assertSchemaIsBenchmark(data.plannedSchemaId);

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
