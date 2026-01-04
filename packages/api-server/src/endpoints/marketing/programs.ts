import { type Program } from "@repo/contracts/program";

import { prisma } from "../../db/client";

export const programsApi = {
  getPrograms: async (): Promise<Program[]> => {
    const programs = await prisma.program.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    return programs;
  },

  getProgramBySlug: async (slug: string): Promise<Program | null> => {
    const program = await prisma.program.findFirst({
      where: {
        slug: slug,
        isActive: true,
      },
    });

    return program;
  },

  getProgramStats: async (programId: string) => {
    const [totalOrders, completedOrders, revenue] = await Promise.all([
      prisma.order.count({ where: { programId } }),
      prisma.order.count({ where: { programId, status: "COMPLETED" } }),
      prisma.order.aggregate({
        where: { programId, status: "COMPLETED" },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalOrders,
      completedOrders,
      revenue: revenue._sum.amount || 0,
    };
  },
};
