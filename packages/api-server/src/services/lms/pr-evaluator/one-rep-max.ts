import { Prisma, type PersonalRecord, type SetLog } from "@prisma/client";

import { extractLoadKg, parseActual } from "./_set-log-actual";

export interface OneRepMaxContext {
  load: number;
  reps: number;
  formula: "epley";
}

export type OneRepMaxDecision =
  | { kind: "create"; value: Prisma.Decimal; context: OneRepMaxContext }
  | { kind: "update"; value: Prisma.Decimal; context: OneRepMaxContext }
  | { kind: "none" };

export const detectOneRepMax = (
  setLog: SetLog,
  existingPr: PersonalRecord | null,
): OneRepMaxDecision => {
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

  const computed1RM = reps === 1 ? kg : kg * (1 + reps / 30);
  const context: OneRepMaxContext = { load: kg, reps, formula: "epley" };

  if (!existingPr) {
    return { kind: "create", value: new Prisma.Decimal(computed1RM), context };
  }

  if (existingPr.value.greaterThanOrEqualTo(computed1RM)) {
    return { kind: "none" };
  }

  return { kind: "update", value: new Prisma.Decimal(computed1RM), context };
};
