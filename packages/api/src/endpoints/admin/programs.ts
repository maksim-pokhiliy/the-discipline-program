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

  createProgram: async (
    data: Omit<Program, "id" | "createdAt" | "updatedAt">,
  ): Promise<Program> => {
    const program = await prisma.program.create({
      data,
    });

    return program;
  },

  updateProgram: async (id: string, data: Partial<Program>): Promise<Program> => {
    const program = await prisma.program.update({
      where: { id },
      data,
    });

    return program;
  },

  deleteProgram: async (id: string): Promise<void> => {
    const orderCount = await prisma.order.count({
      where: { programId: id },
    });

    if (orderCount > 0) {
      throw new Error(`Cannot delete program with ${orderCount} existing orders`);
    }

    await prisma.program.delete({
      where: { id },
    });
  },

  toggleProgramStatus: async (id: string): Promise<Program> => {
    const program = await prisma.program.findUnique({
      where: { id },
    });

    if (!program) {
      throw new Error("Program not found");
    }

    return prisma.program.update({
      where: { id },
      data: { isActive: !program.isActive },
    });
  },
};
