import { type PrismaClient } from "@prisma/client";

import { seedBlockKinds } from "./block-kinds";
import { seedExercises } from "./exercises";
import { seedSchemeTemplates } from "./scheme-templates";

export interface SeedLmsInput {
  db: PrismaClient;
}

export interface SeedLmsResult {
  blockKinds: number;
  schemeTemplates: number;
  exercises: number;
}

export const seedLms = async ({ db }: SeedLmsInput): Promise<SeedLmsResult> => {
  const blockKinds = await seedBlockKinds(db);
  const schemeTemplates = await seedSchemeTemplates(db);
  const exercises = await seedExercises(db);

  return { blockKinds, schemeTemplates, exercises };
};
