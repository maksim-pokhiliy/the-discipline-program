import { Prisma, type PersonalRecord, type SetLog } from "@prisma/client";

import { parseActual } from "./_set-log-actual";

export interface BestTimeForXContext {
  targetReps: number | undefined;
  targetDistanceM: number | undefined;
}

export type BestTimeForXDecision =
  | { kind: "create"; value: Prisma.Decimal; context: BestTimeForXContext }
  | { kind: "update"; value: Prisma.Decimal; context: BestTimeForXContext }
  | { kind: "none" };

export const detectBestTimeForX = (
  setLog: SetLog,
  existingPr: PersonalRecord | null,
): BestTimeForXDecision => {
  const parsed = parseActual(setLog.actual);

  if (!parsed) {
    return { kind: "none" };
  }

  const durationSec = parsed.durationSec;

  if (typeof durationSec !== "number") {
    return { kind: "none" };
  }

  const context: BestTimeForXContext = {
    targetReps: parsed.reps,
    targetDistanceM: parsed.distanceM,
  };

  if (!existingPr) {
    return { kind: "create", value: new Prisma.Decimal(durationSec), context };
  }

  if (existingPr.value.lessThanOrEqualTo(durationSec)) {
    return { kind: "none" };
  }

  return { kind: "update", value: new Prisma.Decimal(durationSec), context };
};
