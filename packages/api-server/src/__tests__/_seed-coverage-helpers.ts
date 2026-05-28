import { type Prisma, type PrismaClient } from "@prisma/client";
import { expect } from "vitest";

const DAY_MS = 86_400_000;
const WEEK_DAYS = 7;
const MONDAY_UTC_DAY = 1;
const WEEK_GAP_MS = WEEK_DAYS * DAY_MS;

export type PlanScopes = {
  blockScope: Prisma.BlockWhereInput;
  schemaScope: Prisma.SchemaWhereInput;
  dayScope: Prisma.DayWhereInput;
};

export const buildPlanScopes = (planId: string): PlanScopes => {
  const blockScope: Prisma.BlockWhereInput = {
    session: { day: { week: { planId } } },
  };

  return {
    blockScope,
    schemaScope: { block: blockScope },
    dayScope: { week: { planId } },
  };
};

export type ArchetypeRefExtractor = (params: unknown) => readonly string[];

export const extractSuperSetRowRefs: ArchetypeRefExtractor = (params) => {
  const typed = params as {
    params?: { pairs?: ReadonlyArray<{ schemaRows?: readonly string[] }> };
  };

  return (typed.params?.pairs ?? []).flatMap((pair) => pair.schemaRows ?? []);
};

export const extractParallelPyramidRefs: ArchetypeRefExtractor = (params) => {
  const typed = params as {
    params?: { pyramids?: ReadonlyArray<{ pairedWithInnerRowId?: string }> };
  };
  const refs: string[] = [];

  for (const pyramid of typed.params?.pyramids ?? []) {
    if (pyramid.pairedWithInnerRowId !== undefined) {
      refs.push(pyramid.pairedWithInnerRowId);
    }
  }

  return refs;
};

export const expectArchetypeRefsResolveToRows = async (
  db: PrismaClient,
  schemaScope: Prisma.SchemaWhereInput,
  archetype: string,
  extractor: ArchetypeRefExtractor,
): Promise<void> => {
  const schemas = await db.schema.findMany({
    where: { ...schemaScope, archetype: { name: archetype } },
    select: { archetypeParams: true },
  });

  expect(schemas.length).toBeGreaterThanOrEqual(1);

  const referenced = new Set<string>();

  for (const schema of schemas) {
    for (const ref of extractor(schema.archetypeParams)) {
      referenced.add(ref);
    }
  }

  if (referenced.size === 0) {
    return;
  }

  const existing = await db.schemaRow.findMany({
    where: { id: { in: [...referenced] } },
    select: { id: true },
  });

  expect(existing.length).toBe(referenced.size);
};

export const expectWeeksAreMondayMonotonic = (weeks: ReadonlyArray<{ startDate: Date }>): void => {
  for (const week of weeks) {
    expect(week.startDate.getUTCDay()).toBe(MONDAY_UTC_DAY);
  }

  for (let i = 1; i < weeks.length; i += 1) {
    const previous = weeks[i - 1];
    const current = weeks[i];

    if (previous === undefined || current === undefined) {
      throw new Error(`unexpected gap at week index ${i}`);
    }

    expect(current.startDate.getTime() - previous.startDate.getTime()).toBe(WEEK_GAP_MS);
  }
};

export const expectArchetypeNamesAllReferenced = async (
  db: PrismaClient,
  schemaScope: Prisma.SchemaWhereInput,
  expectedNames: readonly string[],
): Promise<void> => {
  const archetypeRows = await db.archetype.findMany({ select: { id: true, name: true } });

  expect(archetypeRows.length).toBe(expectedNames.length);

  const usage = await db.schema.groupBy({
    by: ["archetypeId"],
    where: schemaScope,
    _count: { _all: true },
  });
  const idToName = new Map(archetypeRows.map((a) => [a.id, a.name]));
  const referenced = new Set(
    usage.map((u) => idToName.get(u.archetypeId)).filter((name): name is string => name != null),
  );

  for (const archetypeName of expectedNames) {
    expect(referenced.has(archetypeName)).toBe(true);
  }
};

export type ExerciseRefWalkResult = {
  refs: ReadonlySet<string>;
  count: number;
};

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

export const collectExerciseRefs = (node: unknown, sink: Set<string>): void => {
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

export const extractRowPayloadExerciseRefs = (
  rows: ReadonlyArray<{ rowPayload: unknown }>,
): ExerciseRefWalkResult => {
  const refs = new Set<string>();

  for (const row of rows) {
    collectExerciseRefs(row.rowPayload, refs);
  }

  return { refs, count: refs.size };
};
