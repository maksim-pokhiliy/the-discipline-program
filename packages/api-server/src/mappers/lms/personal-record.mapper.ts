import { type PersonalRecord as PrismaPersonalRecord } from "@prisma/client";

import {
  type PersonalRecord,
  personalRecordContextSchema,
} from "@repo/contracts/lms/personal-record";

import { PR_KIND_MAP } from "./enum-maps";

export const mapToPersonalRecord = (p: PrismaPersonalRecord): PersonalRecord => ({
  id: p.id,
  userId: p.userId,
  exerciseId: p.exerciseId,
  kind: PR_KIND_MAP[p.kind],
  value: p.value.toNumber(),
  unit: p.unit,
  context: personalRecordContextSchema.parse(p.context),
  achievedAt: p.achievedAt,
  sourceSetLogId: p.sourceSetLogId,
});
