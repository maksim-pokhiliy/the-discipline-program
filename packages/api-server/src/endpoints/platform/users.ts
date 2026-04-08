import type { UserSearchResult } from "@repo/contracts/user";

import { prisma } from "../../db/client";
import { ROLE_TO_PRISMA_MAP } from "../../mappers/enum-maps";

import { resolveCoachId } from "./guards";

export const platformUsersApi = {
  search: async (userId: string, query: string): Promise<UserSearchResult[]> => {
    await resolveCoachId(userId);

    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        role: ROLE_TO_PRISMA_MAP.USER,
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
