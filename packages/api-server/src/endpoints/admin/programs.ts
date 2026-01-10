import { type Program } from "@repo/contracts/program";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";

export const adminProgramsApi = {
  getPrograms: async (): Promise<Program[]> => {
    return prisma.marketingProgramPreview.findMany({
      orderBy: [{ isActive: "desc" }],
    });
  },

  getProgramById: async (id: string): Promise<Program | null> => {
    const program = await prisma.marketingProgramPreview.findUnique({
      where: { id },
    });

    return program ?? null;
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

  createProgram: async (data: Omit<Program, "id" | "updatedAt">): Promise<Program> => {
    const program = await prisma.marketingProgramPreview.create({
      data,
    });

    return program;
  },

  updateProgram: async (id: string, data: Partial<Program>): Promise<Program> => {
    const program = await prisma.marketingProgramPreview.update({
      where: { id },
      data,
    });

    return program;
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

    return prisma.marketingProgramPreview.update({
      where: { id },
      data: { isActive: !program.isActive },
    });
  },
};
