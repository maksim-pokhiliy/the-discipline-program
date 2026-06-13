import { type Modifier, type ModifierSearchParams } from "@repo/contracts/lms/modifier";

import { requireCoachLikeRole } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToModifier } from "../../../mappers/lms";

export const lmsModifierPlatformApi = {
  list: async (userId: string, query?: ModifierSearchParams): Promise<Modifier[]> => {
    await requireCoachLikeRole(userId);

    const { q } = query ?? {};

    const where = {
      ...(q !== undefined && { nameLower: { contains: q.toLowerCase() } }),
    };

    const rows = await prisma.modifier.findMany({
      ...(Object.keys(where).length > 0 && { where }),
      orderBy: { nameLower: "asc" },
    });

    return rows.map(mapToModifier);
  },
};
