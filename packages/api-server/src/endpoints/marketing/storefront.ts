import { type MarketingStorefrontProgram } from "@prisma/client";

import { type StorefrontProgram } from "@repo/contracts/storefront";

import { prisma } from "../../db/client";

const mapToProgram = (p: MarketingStorefrontProgram): StorefrontProgram => ({
  id: p.id,
  title: p.title,
  slug: p.slug,
  description: p.description,
  priceLabel: p.priceLabel,
  features: p.features,
  isActive: p.isActive,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

export const marketingStorefrontApi = {
  getPrograms: async (): Promise<StorefrontProgram[]> => {
    const programs = await prisma.marketingStorefrontProgram.findMany({
      where: { isActive: true },
    });

    return programs.map(mapToProgram);
  },

  getProgramBySlug: async (slug: string): Promise<StorefrontProgram | null> => {
    const program = await prisma.marketingStorefrontProgram.findFirst({
      where: {
        slug: slug,
        isActive: true,
      },
    });

    return program ? mapToProgram(program) : null;
  },
};
