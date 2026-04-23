import { type BlockType as PrismaBlockType } from "@prisma/client";

import { type BlockType } from "@repo/contracts/library/block-type";

export const mapToBlockType = (row: PrismaBlockType): BlockType => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  description: row.description,
  iconKey: row.iconKey,
  colorKey: row.colorKey,
  sortOrder: row.sortOrder,
  active: row.active,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});
