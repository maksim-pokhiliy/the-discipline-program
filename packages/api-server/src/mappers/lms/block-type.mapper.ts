import { type BlockType as PrismaBlockType } from "@prisma/client";

import { type BlockType } from "@repo/contracts/lms/block-type";

export const mapToBlockType = (b: PrismaBlockType): BlockType => ({
  id: b.id,
  name: b.name,
  description: b.description,
  createdAt: b.createdAt,
  updatedAt: b.updatedAt,
});
