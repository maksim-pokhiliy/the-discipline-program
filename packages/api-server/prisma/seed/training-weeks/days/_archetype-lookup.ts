import { type PrismaClient } from "@prisma/client";

export type ArchetypeLookup = (name: string) => Promise<string>;

export const buildArchetypeLookup = (db: PrismaClient): ArchetypeLookup => {
  const cache = new Map<string, string>();

  return async (name: string): Promise<string> => {
    const cached = cache.get(name);

    if (cached !== undefined) {
      return cached;
    }

    const row = await db.archetype.findUniqueOrThrow({ where: { name } });

    cache.set(name, row.id);

    return row.id;
  };
};
