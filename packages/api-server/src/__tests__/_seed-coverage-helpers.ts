import { type Prisma } from "@prisma/client";
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
