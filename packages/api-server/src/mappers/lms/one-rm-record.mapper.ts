import { type OneRMRecord as PrismaOneRMRecord } from "@prisma/client";

import { type OneRMRecord } from "@repo/contracts/lms/one-rm-record";

import { ONE_RM_RECORD_SOURCE_MAP } from "./one-rm-record.enum-maps";

export const mapToOneRMRecord = (p: PrismaOneRMRecord): OneRMRecord => ({
  id: p.id,
  userId: p.userId,
  exerciseId: p.exerciseId,
  valueKg: Number(p.valueKg),
  recordedAt: p.recordedAt,
  source: ONE_RM_RECORD_SOURCE_MAP[p.source],
});
