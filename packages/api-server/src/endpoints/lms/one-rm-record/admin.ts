import { type CreateOneRMRecordData, type OneRMRecord } from "@repo/contracts/lms/one-rm-record";

import { prisma } from "../../../db/client";
import { mapToOneRMRecord, ONE_RM_RECORD_SOURCE_TO_PRISMA_MAP } from "../../../mappers/lms";
import { handlePrismaError } from "../../../utils";

export const lmsOneRMRecordApi = {
  create: async (userId: string, data: CreateOneRMRecordData): Promise<OneRMRecord> => {
    try {
      const record = await prisma.oneRMRecord.create({
        data: {
          userId,
          exerciseId: data.exerciseId,
          valueKg: data.valueKg,
          recordedAt: data.recordedAt,
          source: ONE_RM_RECORD_SOURCE_TO_PRISMA_MAP[data.source],
        },
      });

      return mapToOneRMRecord(record);
    } catch (error) {
      return handlePrismaError(error, { entity: "One-rep-max record" });
    }
  },

  listByUser: async (userId: string, filter: { exerciseId?: string }): Promise<OneRMRecord[]> => {
    const records = await prisma.oneRMRecord.findMany({
      where: { userId, ...(filter.exerciseId !== undefined && { exerciseId: filter.exerciseId }) },
      orderBy: { recordedAt: "desc" },
    });

    return records.map(mapToOneRMRecord);
  },
};
