import { Prisma, type PersonalRecord, type SetLog } from "@prisma/client";

import { parseActual } from "./_set-log-actual";

export interface MaxCaloriesInTContext {
  timeSec: number | undefined;
}

export type MaxCaloriesInTDecision =
  | { kind: "create"; value: Prisma.Decimal; context: MaxCaloriesInTContext }
  | { kind: "update"; value: Prisma.Decimal; context: MaxCaloriesInTContext }
  | { kind: "none" };

export const detectMaxCaloriesInT = (
  setLog: SetLog,
  existingPr: PersonalRecord | null,
): MaxCaloriesInTDecision => {
  const parsed = parseActual(setLog.actual);

  if (!parsed) {
    return { kind: "none" };
  }

  const calories = parsed.calories;

  if (typeof calories !== "number") {
    return { kind: "none" };
  }

  const context: MaxCaloriesInTContext = { timeSec: parsed.durationSec };

  if (!existingPr) {
    return { kind: "create", value: new Prisma.Decimal(calories), context };
  }

  if (existingPr.value.greaterThanOrEqualTo(calories)) {
    return { kind: "none" };
  }

  return { kind: "update", value: new Prisma.Decimal(calories), context };
};
