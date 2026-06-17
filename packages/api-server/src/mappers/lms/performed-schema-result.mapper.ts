import { type PerformedSchemaResult as PrismaPerformedSchemaResult } from "@prisma/client";

import { resultSchema } from "@repo/contracts/lms/_shared";
import { type PerformedSchemaResult } from "@repo/contracts/lms/performed-schema-result";

export const mapToPerformedSchemaResult = (
  p: PrismaPerformedSchemaResult,
): PerformedSchemaResult => ({
  id: p.id,
  performedSessionId: p.performedSessionId,
  plannedSchemaId: p.plannedSchemaId,
  result: resultSchema.parse(p.result),
  createdAt: p.createdAt,
});
