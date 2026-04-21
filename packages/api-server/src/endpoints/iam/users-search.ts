import { UserRole } from "@repo/contracts/iam/auth";
import type { UserSearchResult } from "@repo/contracts/iam/user";

import { resolveCoachId } from "../../authz/guards";
import { prisma } from "../../db/client";
import { ROLE_TO_PRISMA_MAP } from "../../mappers/iam";

export const iamUserSearchApi = {
  search: async (userId: string, query: string): Promise<UserSearchResult[]> => {
    await resolveCoachId(userId);

    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        role: ROLE_TO_PRISMA_MAP[UserRole.ATHLETE],
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, email: true, image: true },
      take: 20,
      orderBy: { name: "asc" },
    });

    return users;
  },
};
