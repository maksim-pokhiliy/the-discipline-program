import { Prisma, type MarketingStorefrontProgram } from "@prisma/client";

import { type StorefrontProgram } from "@repo/contracts/storefront";
import { ConflictError, NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";

const mapToStorefrontProgram = (p: MarketingStorefrontProgram): StorefrontProgram => ({
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

export const adminStorefrontApi = {
  getPrograms: async (): Promise<StorefrontProgram[]> => {
    const programs = await prisma.marketingStorefrontProgram.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: [{ createdAt: "desc" }, { title: "asc" }],
    });

    return programs.map(mapToStorefrontProgram);
  },

  getProgramById: async (id: string): Promise<StorefrontProgram | null> => {
    const program = await prisma.marketingStorefrontProgram.findUnique({
      where: { id },
    });

    if (!program || program.deletedAt) {
      return null;
    }

    return mapToStorefrontProgram(program);
  },

  getProgramsStats: async () => {
    const [total, active, inactive] = await Promise.all([
      prisma.marketingStorefrontProgram.count({ where: { deletedAt: null } }),
      prisma.marketingStorefrontProgram.count({ where: { isActive: true, deletedAt: null } }),
      prisma.marketingStorefrontProgram.count({ where: { isActive: false, deletedAt: null } }),
    ]);

    return {
      total,
      active,
      inactive,
    };
  },

  getProgramsPageData: async () => {
    const [stats, programs] = await Promise.all([
      adminStorefrontApi.getProgramsStats(),
      adminStorefrontApi.getPrograms(),
    ]);

    return {
      stats,
      programs,
    };
  },

  createProgram: async (
    data: Omit<StorefrontProgram, "id" | "updatedAt" | "createdAt">,
  ): Promise<StorefrontProgram> => {
    try {
      const program = await prisma.marketingStorefrontProgram.create({
        data: {
          ...data,
          priceLabel: data.priceLabel ?? null,
        },
      });

      return mapToStorefrontProgram(program);
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

  updateProgram: async (
    id: string,
    data: Partial<StorefrontProgram>,
  ): Promise<StorefrontProgram> => {
    try {
      const program = await prisma.marketingStorefrontProgram.update({
        where: { id },
        data,
      });

      return mapToStorefrontProgram(program);
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
    const program = await prisma.marketingStorefrontProgram.findUnique({
      where: { id },
    });

    if (!program) {
      throw new NotFoundError("Program not found", { id });
    }

    await prisma.marketingStorefrontProgram.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        slug: `${program.slug}-deleted-${Date.now()}`,
      },
    });
  },

  toggleProgramStatus: async (id: string): Promise<StorefrontProgram> => {
    const program = await prisma.marketingStorefrontProgram.findUnique({
      where: { id },
    });

    if (!program || program.deletedAt) {
      throw new NotFoundError("Program not found", { id });
    }

    const updated = await prisma.marketingStorefrontProgram.update({
      where: { id },
      data: { isActive: !program.isActive },
    });

    return mapToStorefrontProgram(updated);
  },
};
