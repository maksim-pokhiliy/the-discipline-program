import type { CoachListItem } from "@repo/contracts/iam/user";

import { prisma } from "../../db/client";
import { mapToCoachListItem } from "../../mappers/iam";

export const iamAdminCoachListApi = {
  getAll: async (): Promise<CoachListItem[]> => {
    const profiles = await prisma.coachProfile.findMany({
      where: { deletedAt: null },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: [{ user: { name: "asc" } }, { user: { email: "asc" } }],
    });

    return profiles.map(mapToCoachListItem);
  },
};
