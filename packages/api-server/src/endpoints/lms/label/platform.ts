import { type Label } from "@repo/contracts/lms/label";

import { requireCoachLikeRole } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToLabel } from "../../../mappers/lms";

const LABEL_SEARCH_CAP = 50;

export const lmsLabelPlatformApi = {
  list: async (userId: string, query?: string): Promise<Label[]> => {
    await requireCoachLikeRole(userId);

    const rows = await prisma.label.findMany({
      ...(query !== undefined && {
        where: { nameLower: { contains: query.toLowerCase() } },
      }),
      orderBy: { nameLower: "asc" },
      take: LABEL_SEARCH_CAP,
    });

    return rows.map(mapToLabel);
  },
};
