import {
  type BlockType,
  type DayType,
  type Exercise,
  type PrismaClient,
  type SchemeType,
} from "@prisma/client";

import { seedBlockTypes } from "./block-types";
import { seedDayTypes } from "./day-types";
import { seedExercises } from "./exercises";
import { seedSchemeTypes } from "./scheme-types";

export type SeededLibrary = {
  exercises: Map<string, Exercise>;
  blockTypes: Map<string, BlockType>;
  schemeTypes: Map<string, SchemeType>;
  dayTypes: Map<string, DayType>;
};

export const seedLibrary = async (db: PrismaClient): Promise<SeededLibrary> => {
  const [exercises, blockTypes, schemeTypes, dayTypes] = await Promise.all([
    seedExercises(db),
    seedBlockTypes(db),
    seedSchemeTypes(db),
    seedDayTypes(db),
  ]);

  return { exercises, blockTypes, schemeTypes, dayTypes };
};
