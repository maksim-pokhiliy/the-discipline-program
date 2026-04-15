import { type AdminUserView } from "@repo/contracts/coaching/admin-user-view";

import { prisma } from "../../db/client";
import { mapToAdminUserView } from "../../mappers/coaching";
import { findOrThrow } from "../../utils";

const includeWithProfiles = {
  athleteProfile: true,
  coachProfile: true,
} as const;

export const coachingAdminUserViewApi = {
  getById: async (id: string): Promise<AdminUserView> => {
    const user = await findOrThrow(
      prisma.user.findUnique({ where: { id }, include: includeWithProfiles }),
      "User",
    );

    return mapToAdminUserView(user);
  },
};
