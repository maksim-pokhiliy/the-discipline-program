import { Prisma, type PersonalRecord, type SetLog } from "@prisma/client";

import { parseActual } from "./_set-log-actual";

export interface MaxRepsUnbrokenContext {
  setIndex: number;
}

export type MaxRepsUnbrokenDecision =
  | { kind: "create"; value: Prisma.Decimal; context: MaxRepsUnbrokenContext }
  | { kind: "update"; value: Prisma.Decimal; context: MaxRepsUnbrokenContext }
  | { kind: "none" };

export const detectMaxRepsUnbroken = (
  setLog: SetLog,
  existingPr: PersonalRecord | null,
  setIndex: number,
): MaxRepsUnbrokenDecision => {
  const parsed = parseActual(setLog.actual);

  if (!parsed) {
    return { kind: "none" };
  }

  const reps = parsed.reps;

  if (typeof reps !== "number" || reps <= 0) {
    return { kind: "none" };
  }

  const context: MaxRepsUnbrokenContext = { setIndex };

  if (!existingPr) {
    return { kind: "create", value: new Prisma.Decimal(reps), context };
  }

  if (existingPr.value.greaterThanOrEqualTo(reps)) {
    return { kind: "none" };
  }

  return { kind: "update", value: new Prisma.Decimal(reps), context };
};
