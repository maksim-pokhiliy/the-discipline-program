import { type MarketingProgramPreview } from "@prisma/client";

import { type Program } from "@repo/contracts/program";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";

// --- Mappers ---

const mapToProgram = (p: MarketingProgramPreview): Program => ({
  id: p.id,
  title: p.title,
  slug: p.slug,
  description: p.description,
  // В БД String?, в Контракте string | null. Совпадает.
  priceLabel: p.priceLabel,
  features: p.features,
  isActive: p.isActive,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

// --- API ---

export const adminProgramsApi = {
  getPrograms: async (): Promise<Program[]> => {
    const programs = await prisma.marketingProgramPreview.findMany({
      orderBy: [{ isActive: "desc" }],
    });

    return programs.map(mapToProgram);
  },

  getProgramById: async (id: string): Promise<Program | null> => {
    const program = await prisma.marketingProgramPreview.findUnique({
      where: { id },
    });

    return program ? mapToProgram(program) : null;
  },

  getProgramsStats: async () => {
    const [total, active, inactive] = await Promise.all([
      prisma.marketingProgramPreview.count(),
      prisma.marketingProgramPreview.count({ where: { isActive: true } }),
      prisma.marketingProgramPreview.count({ where: { isActive: false } }),
    ]);

    return {
      total,
      active,
      inactive,
    };
  },

  getProgramsPageData: async () => {
    const [stats, programs] = await Promise.all([
      adminProgramsApi.getProgramsStats(),
      adminProgramsApi.getPrograms(),
    ]);

    return {
      stats,
      programs,
    };
  },

  createProgram: async (
    data: Omit<Program, "id" | "updatedAt" | "createdAt">,
  ): Promise<Program> => {
    const program = await prisma.marketingProgramPreview.create({
      data: {
        ...data,
        priceLabel: data.priceLabel ?? null,
      },
    });

    return mapToProgram(program);
  },

  updateProgram: async (id: string, data: Partial<Program>): Promise<Program> => {
    const program = await prisma.marketingProgramPreview.update({
      where: { id },
      data,
    });

    return mapToProgram(program);
  },

  deleteProgram: async (id: string): Promise<void> => {
    await prisma.marketingProgramPreview.delete({
      where: { id },
    });
  },

  toggleProgramStatus: async (id: string): Promise<Program> => {
    const program = await prisma.marketingProgramPreview.findUnique({
      where: { id },
    });

    if (!program) {
      throw new NotFoundError("Program not found", { id });
    }

    const updated = await prisma.marketingProgramPreview.update({
      where: { id },
      data: { isActive: !program.isActive },
    });

    return mapToProgram(updated);
  },
};
