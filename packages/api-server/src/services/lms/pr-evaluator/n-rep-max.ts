import { Prisma, type PersonalRecord, type SetLog } from "@prisma/client";

import { extractLoadKg, parseActual } from "./_set-log-actual";

export interface NRepMaxContext {
  targetReps: number;
}

export type NRepMaxDecision =
  | { kind: "create"; value: Prisma.Decimal; context: NRepMaxContext }
  | { kind: "update"; value: Prisma.Decimal; context: NRepMaxContext }
  | { kind: "none" };

export const detectNRepMax = (
  setLog: SetLog,
  existingPr: PersonalRecord | null,
): NRepMaxDecision => {
  const parsed = parseActual(setLog.actual);

  if (!parsed) {
    return { kind: "none" };
  }

  const reps = parsed.reps;
  const kg = extractLoadKg(parsed.load);

  if (typeof reps !== "number" || reps <= 0) {
    return { kind: "none" };
  }

  if (kg === null || kg <= 0) {
    return { kind: "none" };
  }

  const context: NRepMaxContext = { targetReps: reps };

  if (!existingPr) {
    return { kind: "create", value: new Prisma.Decimal(kg), context };
  }

  if (existingPr.value.greaterThanOrEqualTo(kg)) {
    return { kind: "none" };
  }

  return { kind: "update", value: new Prisma.Decimal(kg), context };
};
