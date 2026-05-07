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

const STALE_CACHE_PATTERN = /cache lookup failed for type/;
const RETRY_DELAY_MS = 5000;
const MAX_RETRIES = 6;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const isStaleCacheError = (error: unknown): boolean =>
  error instanceof Error && STALE_CACHE_PATTERN.test(error.message);

const flushSessionCache = async (db: PrismaClient): Promise<void> => {
  try {
    await db.$executeRawUnsafe("DISCARD ALL");
  } catch {
    return;
  }
};

const withCacheRetry = async <T>(
  db: PrismaClient,
  label: string,
  fn: () => Promise<T>,
): Promise<T> => {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      if (!isStaleCacheError(error) || attempt === MAX_RETRIES - 1) {
        throw error;
      }

      console.log(`  Retrying ${label} (attempt ${attempt + 1}/${MAX_RETRIES})...`);
      await flushSessionCache(db);
      await sleep(RETRY_DELAY_MS);
    }
  }

  throw new Error(`withCacheRetry: exhausted retries for ${label}`);
};

export const seedLibrary = async (db: PrismaClient): Promise<SeededLibrary> => {
  const exercises = await withCacheRetry(db, "exercises", () => seedExercises(db));
  const blockTypes = await withCacheRetry(db, "block types", () => seedBlockTypes(db));
  const schemeTypes = await withCacheRetry(db, "scheme types", () => seedSchemeTypes(db));
  const dayTypes = await withCacheRetry(db, "day types", () => seedDayTypes(db));

  return { exercises, blockTypes, schemeTypes, dayTypes };
};
