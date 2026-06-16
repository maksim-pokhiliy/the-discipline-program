import { Prisma } from "@prisma/client";

import {
  type CreateLabelData,
  type Label,
  type LabelSearchParams,
} from "@repo/contracts/lms/label";

import { requireCoachLikeRole } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToLabel } from "../../../mappers/lms";
import { handlePrismaError } from "../../../utils";

export const lmsLabelPlatformApi = {
  list: async (userId: string, query?: LabelSearchParams): Promise<Label[]> => {
    await requireCoachLikeRole(userId);

    const { q, level } = query ?? {};

    const where = {
      ...(q !== undefined && { nameLower: { contains: q.toLowerCase() } }),
      ...(level !== undefined && { applicableLevels: { array_contains: level } }),
    };

    const rows = await prisma.label.findMany({
      ...(Object.keys(where).length > 0 && { where }),
      orderBy: { nameLower: "asc" },
    });

    return rows.map(mapToLabel);
  },

  create: async (userId: string, data: CreateLabelData): Promise<Label> => {
    await requireCoachLikeRole(userId);

    const nameLower = data.name.trim().toLowerCase();

    try {
      const row = await prisma.label.create({
        data: {
          name: data.name,
          nameLower,
          applicableLevels: data.applicableLevels,
          notes: data.notes ?? null,
          rest: data.rest ?? false,
        },
      });

      return mapToLabel(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const existing = await prisma.label.findUnique({ where: { nameLower } });

        if (existing !== null) {
          return mapToLabel(existing);
        }
      }

      return handlePrismaError(error, { entity: "Label" });
    }
  },
};
