import { type PrismaClient } from "@prisma/client";

import { type SeededLibrary } from "../library";
import { type SeededPlans } from "../training-plans";

import { seedFoundationsGppContent } from "./foundations-gpp";
import { seedTheCompetitorContent } from "./the-competitor";

export const seedPlanContent = async (
  db: PrismaClient,
  plans: SeededPlans,
  library: SeededLibrary,
): Promise<void> => {
  await seedTheCompetitorContent(db, plans.competitor.id, library);
  await seedFoundationsGppContent(db, plans.foundations.id, library);

  console.log(`  Plan content: 2 plans seeded with content`);
};
