import { type DayType, type PrismaClient } from "@prisma/client";

type DayTypeSeed = {
  name: string;
  color: string;
};

const DAY_TYPES: readonly DayTypeSeed[] = [
  { name: "Strength", color: "#3D7BC4" },
  { name: "Conditioning", color: "#E07B35" },
  { name: "Rest", color: "#7A8FA6" },
  { name: "Active Recovery", color: "#4DB76A" },
] as const;

export const seedDayTypes = async (db: PrismaClient): Promise<Map<string, DayType>> => {
  const map = new Map<string, DayType>();

  for (const seed of DAY_TYPES) {
    const dayType = await db.dayType.create({
      data: {
        name: seed.name,
        color: seed.color,
      },
    });

    map.set(dayType.name, dayType);
  }

  console.log(`  Day types: ${map.size}`);

  return map;
};
