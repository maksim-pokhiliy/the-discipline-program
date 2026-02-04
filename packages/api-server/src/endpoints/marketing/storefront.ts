import { type StorefrontProgram } from "@repo/contracts/storefront";

import { prisma } from "../../db/client";
import { mapToStorefrontProgram } from "../../mappers";

export const marketingStorefrontApi = {
  getPrograms: async (): Promise<StorefrontProgram[]> => {
    const programs = await prisma.marketingStorefrontProgram.findMany({
      where: { isActive: true, deletedAt: null },
    });

    return programs.map(mapToStorefrontProgram);
  },

  getProgramBySlug: async (slug: string): Promise<StorefrontProgram | null> => {
    const program = await prisma.marketingStorefrontProgram.findFirst({
      where: {
        slug,
        isActive: true,
        deletedAt: null,
      },
    });

    return program ? mapToStorefrontProgram(program) : null;
  },
};
