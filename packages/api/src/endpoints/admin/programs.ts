import { Program } from "../../types";
import { prisma } from "../../db/client";

export const adminProgramsApi = {
  getPrograms: async (): Promise<Program[]> => {
    const programs = await prisma.program.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return programs;
  },

  getProgramById: async (id: string): Promise<Program | null> => {
    const program = await prisma.program.findUnique({
      where: { id },
    });

    return program;
  },

  getProgramsStats: async () => {
    const [total, active, inactive] = await Promise.all([
      prisma.program.count(),
      prisma.program.count({ where: { isActive: true } }),
      prisma.program.count({ where: { isActive: false } }),
    ]);

    return {
      total,
      active,
      inactive,
    };
  },
};
