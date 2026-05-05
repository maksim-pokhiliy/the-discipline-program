import {
  type AdminBlockTypesPageData,
  type BlockType,
  type CreateBlockTypeData,
  type UpdateBlockTypeData,
} from "@repo/contracts/lms/block-type";
import { ConflictError } from "@repo/errors";

import { prisma } from "../../../../db/client";
import { mapToBlockType } from "../../../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../../../utils";

const ensureUniqueName = async (name: string, excludeId?: string): Promise<void> => {
  const existing = await prisma.blockType.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      ...(excludeId !== undefined && { id: { not: excludeId } }),
    },
  });

  if (existing) {
    throw new ConflictError("BlockType with this name already exists", { field: "name" });
  }
};

export const lmsBlockTypeAdminApi = {
  getBlockTypes: async (): Promise<BlockType[]> => {
    const blockTypes = await prisma.blockType.findMany({
      orderBy: { createdAt: "desc" },
    });

    return blockTypes.map(mapToBlockType);
  },

  getBlockTypeById: async (id: string): Promise<BlockType> => {
    const blockType = await findOrThrow(
      prisma.blockType.findUnique({ where: { id } }),
      "BlockType",
    );

    return mapToBlockType(blockType);
  },

  createBlockType: async (data: CreateBlockTypeData): Promise<BlockType> => {
    await ensureUniqueName(data.name);

    try {
      const blockType = await prisma.blockType.create({
        data: {
          name: data.name,
          ...(data.description !== undefined && { description: data.description }),
        },
      });

      return mapToBlockType(blockType);
    } catch (error) {
      return handlePrismaError(error, { entity: "BlockType", field: "name" });
    }
  },

  updateBlockType: async (id: string, data: UpdateBlockTypeData): Promise<BlockType> => {
    await findOrThrow(prisma.blockType.findUnique({ where: { id } }), "BlockType");

    if (data.name !== undefined) {
      await ensureUniqueName(data.name, id);
    }

    try {
      const blockType = await prisma.blockType.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
        },
      });

      return mapToBlockType(blockType);
    } catch (error) {
      return handlePrismaError(error, { entity: "BlockType", field: "name" });
    }
  },

  deleteBlockType: async (id: string): Promise<void> => {
    try {
      await prisma.blockType.delete({ where: { id } });
    } catch (error) {
      return handlePrismaError(error, { entity: "BlockType" });
    }
  },

  getBlockTypesPageData: async (): Promise<AdminBlockTypesPageData> => {
    const blockTypes = await lmsBlockTypeAdminApi.getBlockTypes();

    return { blockTypes };
  },
};
