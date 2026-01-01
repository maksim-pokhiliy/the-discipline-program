import { Program } from "../../types";
import { prisma } from "../../db/client";
import { NotFoundError, BadRequestError } from "@repo/errors";

type SortOrderUpdate = {
  id: string;
  sortOrder: number;
};

export const adminProgramsApi = {
  getPrograms: async (): Promise<Program[]> => {
    const programs = await prisma.program.findMany({
      orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return programs;
  },

  getProgramById: async (id: string): Promise<Program | null> => {
    const program = await prisma.program.findUnique({
      where: { id },
    });

    return program ?? null;
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
      throw new BadRequestError(`Cannot delete program with ${orderCount} existing orders`, {
        programId: id,
        orderCount,
      });
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
      throw new NotFoundError("Program not found", { id });
    }

    return prisma.program.update({
      where: { id },
      data: { isActive: !program.isActive },
    });
  },

  updateProgramsOrder: async (updates: SortOrderUpdate[]): Promise<void> => {
    if (updates.length === 0) {
      return;
    }

    await prisma.$transaction(
      updates.map((u) =>
        prisma.program.update({
          where: { id: u.id },
          data: { sortOrder: u.sortOrder },
        }),
      ),
    );
  },
};
