import { type CanonicalSeed, type ExerciseCatalogEntry } from "../_canonical/canonical-schema";

const EXERCISE_ID_KEYS = new Set<string>([
  "exerciseId",
  "tailExerciseId",
  "primaryExerciseId",
  "secondaryExerciseId",
  "alternativeExerciseId",
  "optionalRotationStepExerciseId",
  "placeholderExerciseId",
]);

const isCanonicalEntry = (entry: ExerciseCatalogEntry): boolean =>
  entry.primaryEquipment !== "UNKNOWN" && entry.movementTypeTagPrimary !== "UNKNOWN";

const pickWinner = (group: ReadonlyArray<ExerciseCatalogEntry>): ExerciseCatalogEntry => {
  const canonicals = group.filter(isCanonicalEntry);

  if (canonicals.length === 1) {
    return canonicals[0]!;
  }

  if (canonicals.length === 0) {
    throw new Error(
      `catalog-dedupe: group "${group[0]!.canonicalName.toLowerCase()}" has ${group.length} entries but no canonical winner (none with non-UNKNOWN equipment+movement)`,
    );
  }

  throw new Error(
    `catalog-dedupe: group "${group[0]!.canonicalName.toLowerCase()}" has ${canonicals.length} canonical winners (expected exactly 1); refs: ${canonicals.map((e) => e.ref).join(", ")}`,
  );
};

const groupByCanonicalNameLower = (
  entries: ReadonlyArray<ExerciseCatalogEntry>,
): ReadonlyMap<string, ReadonlyArray<ExerciseCatalogEntry>> => {
  const groups = new Map<string, ExerciseCatalogEntry[]>();

  for (const entry of entries) {
    const key = entry.canonicalName.toLowerCase();
    const bucket = groups.get(key);

    if (bucket === undefined) {
      groups.set(key, [entry]);
    } else {
      bucket.push(entry);
    }
  }

  return groups;
};

const buildLoserMap = (
  groups: ReadonlyMap<string, ReadonlyArray<ExerciseCatalogEntry>>,
): ReadonlyMap<string, string> => {
  const loserToWinner = new Map<string, string>();

  for (const group of groups.values()) {
    if (group.length < 2) {
      continue;
    }

    const winner = pickWinner(group);

    for (const entry of group) {
      if (entry.ref !== winner.ref) {
        loserToWinner.set(entry.ref, winner.ref);
      }
    }
  }

  return loserToWinner;
};

const rewriteExerciseRefs = (value: unknown, loserToWinner: ReadonlyMap<string, string>): void => {
  if (Array.isArray(value)) {
    for (const item of value) {
      rewriteExerciseRefs(item, loserToWinner);
    }

    return;
  }

  if (value === null || typeof value !== "object") {
    return;
  }

  const record = value as Record<string, unknown>;

  for (const key of Object.keys(record)) {
    const child = record[key];

    if (EXERCISE_ID_KEYS.has(key) && typeof child === "string") {
      const winner = loserToWinner.get(child);

      if (winner !== undefined) {
        record[key] = winner;
      }

      continue;
    }

    rewriteExerciseRefs(child, loserToWinner);
  }
};

export const dedupeCatalogByCanonicalNameLower = (seed: CanonicalSeed): CanonicalSeed => {
  const groups = groupByCanonicalNameLower(seed.catalog.exercises);
  const loserToWinner = buildLoserMap(groups);

  if (loserToWinner.size === 0) {
    return seed;
  }

  const cloned = structuredClone(seed);

  cloned.catalog.exercises = cloned.catalog.exercises.filter(
    (entry) => !loserToWinner.has(entry.ref),
  );

  rewriteExerciseRefs(cloned.weeks, loserToWinner);
  rewriteExerciseRefs(cloned.phase7Examples, loserToWinner);

  console.log(
    `  Catalog: merged ${loserToWinner.size} adhoc entries with canonical equivalents (Session B parser bug — recommend regen with case-insensitive lookup)`,
  );

  return cloned;
};

export const assertNoCanonicalNameLowerCollisions = (seed: CanonicalSeed): void => {
  const seen = new Set<string>();
  const collisions: string[] = [];

  for (const entry of seed.catalog.exercises) {
    const key = entry.canonicalName.toLowerCase();

    if (seen.has(key)) {
      collisions.push(`${key} (ref ${entry.ref})`);
    } else {
      seen.add(key);
    }
  }

  if (collisions.length > 0) {
    throw new Error(
      `catalog-dedupe: canonicalNameLower collisions remain after dedupe (defensive guard): ${collisions.join("; ")}`,
    );
  }
};
