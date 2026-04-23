import { type Scheme } from "@repo/contracts/library/scheme";

import { prisma } from "../../../db/client";
import { mapToScheme } from "../../../mappers/library";

export const librarySchemePublicApi = {
  list: async (): Promise<Scheme[]> => {
    const rows = await prisma.scheme.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return rows.map(mapToScheme);
  },
};
