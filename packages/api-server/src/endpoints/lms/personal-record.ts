import { type Prisma } from "@prisma/client";

import { UserRole } from "@repo/contracts/iam/auth";
import { type ListPersonalRecordsQuery } from "@repo/contracts/lms/personal-record";
import { ForbiddenError } from "@repo/errors";

import { requireCoachLikeRole } from "../../authz/guards";
import { prisma } from "../../db/client";
import { mapToPersonalRecord, PR_KIND_TO_PRISMA_MAP } from "../../mappers/lms";
import { findOrThrow } from "../../utils";
import { DEFAULT_LIST_LIMIT } from "../../utils/list-limits";

export const lmsPersonalRecordApi = {
  list: async (userId: string, query: ListPersonalRecordsQuery) => {
    const role = await requireCoachLikeRole(userId);

    if (
      query.userId &&
      query.userId !== userId &&
      role !== UserRole.ADMIN &&
      role !== UserRole.HEAD_COACH
    ) {
      throw new ForbiddenError("Cannot read personal records for another user");
    }

    const where: Prisma.PersonalRecordWhereInput = {
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.exerciseId ? { exerciseId: query.exerciseId } : {}),
      ...(query.kind ? { kind: PR_KIND_TO_PRISMA_MAP[query.kind] } : {}),
    };

    const take = query.take ?? DEFAULT_LIST_LIMIT;

    const [total, items] = await prisma.$transaction([
      prisma.personalRecord.count({ where }),
      prisma.personalRecord.findMany({
        where,
        orderBy: { achievedAt: "desc" },
        take,
      }),
    ]);

    return { items: items.map(mapToPersonalRecord), total };
  },

  getById: async (userId: string, personalRecordId: string) => {
    const role = await requireCoachLikeRole(userId);

    const record = await findOrThrow(
      prisma.personalRecord.findUnique({ where: { id: personalRecordId } }),
      "Personal record",
    );

    if (record.userId !== userId && role !== UserRole.ADMIN && role !== UserRole.HEAD_COACH) {
      throw new ForbiddenError("Personal record belongs to another user");
    }

    return mapToPersonalRecord(record);
  },
};
