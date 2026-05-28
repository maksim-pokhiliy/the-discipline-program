import { type Label, type LabelSearchParams } from "@repo/contracts/lms/label";

import { requireCoachLikeRole } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToLabel } from "../../../mappers/lms";

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
};
