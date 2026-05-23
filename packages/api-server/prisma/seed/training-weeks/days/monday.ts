import { type PrismaClient } from "@prisma/client";

import { requireId } from "../_id-helpers";
import { type SeedCatalogIds } from "../_supporting-catalog";

import { type ArchetypeLookup } from "./_archetype-lookup";
import { seedMondayBlockMetcon } from "./monday-metcon-block";
import { seedMondayBlockStrength } from "./monday-strength-block";

export const seedMonday = async (
  db: PrismaClient,
  weekId: string,
  catalog: SeedCatalogIds,
  lookupArchetype: ArchetypeLookup,
): Promise<void> => {
  const { exerciseIds, labelIds } = catalog;

  const day = await db.day.create({
    data: {
      weekId,
      dayOfWeek: "MONDAY",
      labelId: labelIds.main,
      notes: "Heavy day. Coffee + 15-min mobility before squat.",
    },
  });

  const session = await db.session.create({
    data: {
      dayId: requireId(day),
      order: 1,
      labelId: null,
      notes: "~ 75 min",
      freezeLoadsAtCreation: true,
    },
  });

  const sessionId = requireId(session);

  await seedMondayBlockStrength(db, sessionId, exerciseIds, labelIds, lookupArchetype);
  await seedMondayBlockMetcon(db, sessionId, exerciseIds, labelIds, lookupArchetype);
};
