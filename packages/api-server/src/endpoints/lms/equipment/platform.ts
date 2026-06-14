import { type Equipment, type EquipmentSearchParams } from "@repo/contracts/lms/equipment";

import { requireCoachLikeRole } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToEquipment } from "../../../mappers/lms";

export const lmsEquipmentPlatformApi = {
  list: async (userId: string, query?: EquipmentSearchParams): Promise<Equipment[]> => {
    await requireCoachLikeRole(userId);

    const { q } = query ?? {};

    const where = {
      ...(q !== undefined && { nameLower: { contains: q.toLowerCase() } }),
    };

    const rows = await prisma.equipment.findMany({
      ...(Object.keys(where).length > 0 && { where }),
      orderBy: { nameLower: "asc" },
    });

    return rows.map(mapToEquipment);
  },
};
