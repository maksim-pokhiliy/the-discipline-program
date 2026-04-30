import { type Prisma } from "@prisma/client";

import { UserRole } from "@repo/contracts/iam/auth";
import { type ListWeeklyVolumesQuery } from "@repo/contracts/lms/weekly-volume";
import { ForbiddenError } from "@repo/errors";

import { requireCoachLikeRole } from "../../authz/guards";
import { prisma } from "../../db/client";
import { mapToWeeklyVolume } from "../../mappers/lms";
import { findOrThrow } from "../../utils";

export const lmsWeeklyVolumeApi = {
  list: async (userId: string, query: ListWeeklyVolumesQuery) => {
    const role = await requireCoachLikeRole(userId);

    if (
      query.userId &&
      query.userId !== userId &&
      role !== UserRole.ADMIN &&
      role !== UserRole.HEAD_COACH
    ) {
      throw new ForbiddenError("Cannot read weekly volume for another user");
    }

    const where: Prisma.WeeklyVolumeWhereInput = {
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.fromDate || query.toDate
        ? {
            weekStartDate: {
              ...(query.fromDate ? { gte: query.fromDate } : {}),
              ...(query.toDate ? { lte: query.toDate } : {}),
            },
          }
        : {}),
    };

    const items = await prisma.weeklyVolume.findMany({
      where,
      orderBy: { weekStartDate: "desc" },
    });

    return { items: items.map(mapToWeeklyVolume), total: items.length };
  },

  getById: async (userId: string, weeklyVolumeId: string) => {
    const role = await requireCoachLikeRole(userId);

    const record = await findOrThrow(
      prisma.weeklyVolume.findUnique({ where: { id: weeklyVolumeId } }),
      "Weekly volume",
    );

    if (record.userId !== userId && role !== UserRole.ADMIN && role !== UserRole.HEAD_COACH) {
      throw new ForbiddenError("Weekly volume belongs to another user");
    }

    return mapToWeeklyVolume(record);
  },
};
