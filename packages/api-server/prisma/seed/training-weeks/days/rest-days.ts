import { type PrismaClient } from "@prisma/client";

import { type SeedCatalogIds } from "../_supporting-catalog";

export const seedWednesday = async (
  db: PrismaClient,
  weekId: string,
  catalog: SeedCatalogIds,
): Promise<void> => {
  await db.day.create({
    data: {
      weekId,
      dayOfWeek: "WEDNESDAY",
      labelId: catalog.labelIds.restDay,
      notes: "Active recovery — walk 30 min, mobility (hips + shoulders), 8h sleep.",
    },
  });
};

export const seedSunday = async (
  db: PrismaClient,
  weekId: string,
  catalog: SeedCatalogIds,
): Promise<void> => {
  await db.day.create({
    data: {
      weekId,
      dayOfWeek: "SUNDAY",
      labelId: catalog.labelIds.restDay,
      notes: "Off. Eat. Sleep.",
    },
  });
};
