import { Prisma, type MarketingProgramPreview } from "@prisma/client";

import { type Program } from "@repo/contracts/program";
import { ConflictError, NotFoundError } from "@repo/errors";

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

export const adminProgramsApi = {
  getPrograms: async (): Promise<Program[]> => {
    const programs = await prisma.marketingProgramPreview.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: [{ createdAt: "desc" }, { title: "asc" }],
    });

    return programs.map(mapToProgram);
  },

  getProgramById: async (id: string): Promise<Program | null> => {
    const program = await prisma.marketingProgramPreview.findUnique({
      where: { id },
    });

    if (!program || program.deletedAt) {
      return null;
    }

    return mapToProgram(program);
  },

  getProgramsStats: async () => {
    const [total, active, inactive] = await Promise.all([
      prisma.marketingProgramPreview.count({ where: { deletedAt: null } }),
      prisma.marketingProgramPreview.count({ where: { isActive: true, deletedAt: null } }),
      prisma.marketingProgramPreview.count({ where: { isActive: false, deletedAt: null } }),
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
    try {
      const program = await prisma.marketingProgramPreview.create({
        data: {
          ...data,
          priceLabel: data.priceLabel ?? null,
        },
      });

      return mapToProgram(program);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        error.meta?.target &&
        Array.isArray(error.meta.target) &&
        error.meta.target.includes("slug")
      ) {
        throw new ConflictError("Program with this slug already exists", { field: "slug" });
      }

      throw error;
    }
  },

  updateProgram: async (id: string, data: Partial<Program>): Promise<Program> => {
    try {
      const program = await prisma.marketingProgramPreview.update({
        where: { id },
        data,
      });

      return mapToProgram(program);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        error.meta?.target &&
        Array.isArray(error.meta.target) &&
        error.meta.target.includes("slug")
      ) {
        throw new ConflictError("Program with this slug already exists", { field: "slug" });
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundError("Program not found", { id });
      }

      throw error;
    }
  },

  deleteProgram: async (id: string): Promise<void> => {
    const program = await prisma.marketingProgramPreview.findUnique({
      where: { id },
    });

    if (!program) {
      throw new NotFoundError("Program not found", { id });
    }

    await prisma.marketingProgramPreview.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        slug: `${program.slug}-deleted-${Date.now()}`,
      },
    });
  },

  toggleProgramStatus: async (id: string): Promise<Program> => {
    const program = await prisma.marketingProgramPreview.findUnique({
      where: { id },
    });

    if (!program || program.deletedAt) {
      throw new NotFoundError("Program not found", { id });
    }

    const updated = await prisma.marketingProgramPreview.update({
      where: { id },
      data: { isActive: !program.isActive },
    });

    return mapToProgram(updated);
  },
};
