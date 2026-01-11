import { type MarketingProgramPreview } from "@prisma/client";

import { type Program } from "@repo/contracts/program";

import { prisma } from "../../db/client";

const mapToProgram = (p: MarketingProgramPreview): Program => ({
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

export const programsApi = {
  getPrograms: async (): Promise<Program[]> => {
    const programs = await prisma.marketingProgramPreview.findMany({
      where: { isActive: true },
    });

    return programs.map(mapToProgram);
  },

  getProgramBySlug: async (slug: string): Promise<Program | null> => {
    const program = await prisma.marketingProgramPreview.findFirst({
      where: {
        slug: slug,
        isActive: true,
      },
    });

    return program ? mapToProgram(program) : null;
  },
};
