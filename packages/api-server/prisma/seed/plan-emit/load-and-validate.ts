import { exerciseCuid } from "../plan-data/builder";
import {
  canonicalSeedSchema,
  type CanonicalBlock,
  type CanonicalSeed,
  type CanonicalSession,
} from "../plan-data/canonical-schema";
import { SYNTHETIC_DEMO_PLAN } from "../plan-data/plan-synthetic";

const MAX_ZOD_ISSUES_SHOWN = 20;
const MAX_ORPHAN_REFS_SHOWN = 20;
const MAX_DUP_BLOCK_REFS_SHOWN = 20;

const EXERCISE_REF_KEYS = new Set<string>([
  "exerciseId",
  "tailExerciseId",
  "primaryExerciseId",
  "secondaryExerciseId",
  "alternativeExerciseId",
  "optionalRotationStepExerciseId",
  "placeholderExerciseId",
  "targetExerciseId",
]);

const collectExerciseRefs = (node: unknown, sink: Set<string>): void => {
  if (Array.isArray(node)) {
    for (const item of node) {
      collectExerciseRefs(item, sink);
    }

    return;
  }

  if (node === null || typeof node !== "object") {
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    if (EXERCISE_REF_KEYS.has(key) && typeof value === "string") {
      sink.add(value);
    }

    collectExerciseRefs(value, sink);
  }
};

const assertExerciseRefsResolve = (seed: CanonicalSeed): void => {
  const catalogIds = new Set(
    seed.catalog.exercises.map((entry) => exerciseCuid(entry.canonicalName)),
  );

  if (catalogIds.size !== seed.catalog.exercises.length) {
    throw new Error(
      `Canonical catalog has exerciseCuid collisions: ${seed.catalog.exercises.length} entries produced ${catalogIds.size} distinct ids (duplicate canonicalName or SHA-1 truncation collision)`,
    );
  }

  const referenced = new Set<string>();

  collectExerciseRefs(seed.weeks, referenced);
  collectExerciseRefs(seed.phase7Examples, referenced);

  const orphans = [...referenced].filter((ref) => !catalogIds.has(ref));

  if (orphans.length > 0) {
    const shown = orphans.slice(0, MAX_ORPHAN_REFS_SHOWN).join(", ");

    throw new Error(
      `Canonical seed has ${orphans.length} orphan exercise ref(s) (showing first ${MAX_ORPHAN_REFS_SHOWN}): ${shown}\n` +
        `Hint: a row.exerciseId (or percentage targetExerciseId) has no catalog entry whose exerciseCuid(canonicalName) matches; add the catalog entry or fix the ref.`,
    );
  }
};

const collectBlocksFromSessions = (sessions: CanonicalSession[], sink: CanonicalBlock[]): void => {
  for (const session of sessions) {
    for (const block of session.blocks) {
      sink.push(block);
    }
  }
};

const assertBlockRefsUnique = (seed: CanonicalSeed): void => {
  const blocks: CanonicalBlock[] = [];

  for (const week of seed.weeks) {
    for (const day of week.days) {
      collectBlocksFromSessions(day.sessions, blocks);
    }
  }

  collectBlocksFromSessions(seed.phase7Examples, blocks);

  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const block of blocks) {
    if (seen.has(block.blockInstanceRef)) {
      duplicates.add(block.blockInstanceRef);
    }

    seen.add(block.blockInstanceRef);
  }

  if (duplicates.size > 0) {
    const shown = [...duplicates].slice(0, MAX_DUP_BLOCK_REFS_SHOWN).join(", ");

    throw new Error(
      `Canonical seed has ${duplicates.size} duplicate blockInstanceRef(s) (showing first ${MAX_DUP_BLOCK_REFS_SHOWN}): ${shown}\n` +
        `Hint: each block instance must carry a unique block-NNN ref; rename the colliding occurrence.`,
    );
  }
};

export const loadCanonicalSeed = async (): Promise<CanonicalSeed> => {
  const result = canonicalSeedSchema.safeParse(SYNTHETIC_DEMO_PLAN);

  if (!result.success) {
    const total = result.error.issues.length;
    const errorSummary = result.error.issues
      .slice(0, MAX_ZOD_ISSUES_SHOWN)
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Synthetic plan failed Zod validation (showing first ${MAX_ZOD_ISSUES_SHOWN} issues):\n${errorSummary}\nTotal issues: ${total}`,
    );
  }

  assertExerciseRefsResolve(result.data);
  assertBlockRefsUnique(result.data);

  return result.data;
};
