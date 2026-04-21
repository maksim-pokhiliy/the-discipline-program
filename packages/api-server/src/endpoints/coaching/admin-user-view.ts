import { type Prisma } from "@prisma/client";

import { type AdminUserView } from "@repo/contracts/coaching/admin-user-view";

import { prisma } from "../../db/client";
import { mapToAdminUserView } from "../../mappers/coaching";
import { findOrThrow } from "../../utils";

const includeWithProfiles = {
  athleteProfile: true,
  coachProfile: true,
  athleteAssignments: {
    where: { coach: { deletedAt: null } },
    include: {
      coach: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: [
      { coach: { user: { name: "asc" as const } } },
      { coach: { user: { email: "asc" as const } } },
    ],
  },
} satisfies Prisma.UserInclude;

export const coachingAdminUserViewApi = {
  getById: async (id: string): Promise<AdminUserView> => {
    const user = await findOrThrow(
      prisma.user.findUnique({ where: { id }, include: includeWithProfiles }),
      "User",
    );

    return mapToAdminUserView(user);
  },
};
