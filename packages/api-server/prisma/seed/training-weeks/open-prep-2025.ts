import { type PrismaClient } from "@prisma/client";

import { requireId } from "../_id-helpers";

import { monday } from "./_id-helpers";
import { seedSupportingCatalog } from "./_supporting-catalog";
import { buildArchetypeLookup } from "./days/_archetype-lookup";
import { seedFriday } from "./days/friday";
import { seedMonday } from "./days/monday";
import { seedSunday, seedWednesday } from "./days/rest-days";
import { seedSaturday } from "./days/saturday";
import { seedThursday } from "./days/thursday";
import { seedTuesday } from "./days/tuesday";

export const seedTrainingWeeks = async (
  db: PrismaClient,
  archivedPlanId: string,
): Promise<void> => {
  const catalog = await seedSupportingCatalog(db);
  const lookupArchetype = buildArchetypeLookup(db);

  const week = await db.week.create({
    data: {
      planId: archivedPlanId,
      startDate: monday("2025-01-06"),
      notes: "Open prep — edge-case coverage week for plan-editor redesign.",
    },
  });

  const weekId = requireId(week);

  await seedMonday(db, weekId, catalog, lookupArchetype);
  await seedTuesday(db, weekId, catalog, lookupArchetype);
  await seedWednesday(db, weekId, catalog);
  await seedThursday(db, weekId, catalog, lookupArchetype);
  await seedFriday(db, weekId, catalog, lookupArchetype);
  await seedSaturday(db, weekId, catalog, lookupArchetype);
  await seedSunday(db, weekId, catalog);

  console.log("  Training weeks: 1 (2025-W2, 5 sessions, edge-case coverage)");
};
