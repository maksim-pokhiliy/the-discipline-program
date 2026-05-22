import { type Archetype } from "@repo/contracts/lms/archetype";

import { requireCoachLikeRole } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToArchetype } from "../../../mappers/lms";

export const lmsArchetypePlatformApi = {
  list: async (userId: string): Promise<Archetype[]> => {
    await requireCoachLikeRole(userId);

    const rows = await prisma.archetype.findMany({
      orderBy: [{ family: "asc" }, { name: "asc" }],
    });

    return rows.map(mapToArchetype);
  },
};
