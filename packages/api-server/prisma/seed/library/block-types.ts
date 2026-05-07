import { type BlockType, type PrismaClient } from "@prisma/client";

type BlockTypeSeed = {
  name: string;
  description: string | null;
};

const BLOCK_TYPES: readonly BlockTypeSeed[] = [
  { name: "Warm-Up", description: null },
  { name: "Strength", description: "Heavy compound lifts" },
  { name: "Strength Endurance", description: null },
  { name: "Gymnastics", description: null },
  { name: "Conditioning", description: "MetCon work" },
  { name: "Accessory", description: null },
  { name: "Cool-Down", description: null },
] as const;

export const seedBlockTypes = async (db: PrismaClient): Promise<Map<string, BlockType>> => {
  const map = new Map<string, BlockType>();

  for (const seed of BLOCK_TYPES) {
    const blockType = await db.blockType.create({
      data: {
        name: seed.name,
        description: seed.description,
      },
    });

    map.set(blockType.name, blockType);
  }

  console.log(`  Block types: ${map.size}`);

  return map;
};
