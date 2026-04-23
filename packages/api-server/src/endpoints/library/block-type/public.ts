import { type BlockType } from "@repo/contracts/library/block-type";

import { prisma } from "../../../db/client";
import { mapToBlockType } from "../../../mappers/library";

export const libraryBlockTypePublicApi = {
  list: async (): Promise<BlockType[]> => {
    const rows = await prisma.blockType.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return rows.map(mapToBlockType);
  },
};
