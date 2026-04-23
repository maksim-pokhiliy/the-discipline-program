import { type Prisma } from "@prisma/client";

import {
  type BlockType,
  type CreateBlockTypeData,
  type UpdateBlockTypeData,
} from "@repo/contracts/library/block-type";
import { ConflictError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { mapToBlockType } from "../../../mappers/library";
import { findOrThrow, handlePrismaError } from "../../../utils";

const toCreateInput = (data: CreateBlockTypeData): Prisma.BlockTypeUncheckedCreateInput => ({
  slug: data.slug,
  name: data.name,
  description: data.description ?? null,
  iconKey: data.iconKey ?? null,
  colorKey: data.colorKey ?? null,
  sortOrder: data.sortOrder,
  active: data.active,
});

const toUpdateData = (data: UpdateBlockTypeData): Prisma.BlockTypeUncheckedUpdateInput => {
  const update: Prisma.BlockTypeUncheckedUpdateInput = {};

  if (data.slug !== undefined) {
    update.slug = data.slug;
  }

  if (data.name !== undefined) {
    update.name = data.name;
  }

  if (data.description !== undefined) {
    update.description = data.description ?? null;
  }

  if (data.iconKey !== undefined) {
    update.iconKey = data.iconKey ?? null;
  }

  if (data.colorKey !== undefined) {
    update.colorKey = data.colorKey ?? null;
  }

  if (data.sortOrder !== undefined) {
    update.sortOrder = data.sortOrder;
  }

  if (data.active !== undefined) {
    update.active = data.active;
  }

  return update;
};

export const libraryBlockTypeAdminApi = {
  list: async (params?: { includeInactive?: boolean }): Promise<BlockType[]> => {
    const includeInactive = params?.includeInactive ?? false;

    const rows = await prisma.blockType.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return rows.map(mapToBlockType);
  },

  getById: async (id: string): Promise<BlockType> => {
    const row = await findOrThrow(prisma.blockType.findUnique({ where: { id } }), "Block type");

    return mapToBlockType(row);
  },

  create: async (input: CreateBlockTypeData): Promise<BlockType> => {
    try {
      const row = await prisma.blockType.create({ data: toCreateInput(input) });

      return mapToBlockType(row);
    } catch (error) {
      return handlePrismaError(error, { entity: "Block type", field: "slug" });
    }
  },

  update: async (params: { id: string; input: UpdateBlockTypeData }): Promise<BlockType> => {
    const { id, input } = params;

    await findOrThrow(prisma.blockType.findUnique({ where: { id } }), "Block type");

    try {
      const row = await prisma.blockType.update({
        where: { id },
        data: toUpdateData(input),
      });

      return mapToBlockType(row);
    } catch (error) {
      return handlePrismaError(error, { entity: "Block type", field: "slug" });
    }
  },

  delete: async (id: string): Promise<void> => {
    await findOrThrow(prisma.blockType.findUnique({ where: { id } }), "Block type");

    const usage = await prisma.workoutBlock.count({ where: { blockTypeId: id } });

    if (usage > 0) {
      throw new ConflictError("Block type is referenced by existing workout blocks", {
        id,
        referenceCount: usage,
      });
    }

    try {
      await prisma.blockType.delete({ where: { id } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Block type" });
    }
  },
};
