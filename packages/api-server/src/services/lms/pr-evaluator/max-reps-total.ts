import { Prisma, type PersonalRecord, type SetLog } from "@prisma/client";

import { parseActual } from "./_set-log-actual";

export interface MaxRepsTotalContext {
  totalReps: number;
}

export type MaxRepsTotalDecision =
  | { kind: "create"; value: Prisma.Decimal; context: MaxRepsTotalContext }
  | { kind: "update"; value: Prisma.Decimal; context: MaxRepsTotalContext }
  | { kind: "none" };

export const detectMaxRepsTotal = (
  siblingSetLogs: SetLog[],
  existingPr: PersonalRecord | null,
): MaxRepsTotalDecision => {
  let total = 0;

  for (const sl of siblingSetLogs) {
    const parsed = parseActual(sl.actual);

    if (parsed && typeof parsed.reps === "number" && parsed.reps > 0) {
      total += parsed.reps;
    }
  }

  if (total <= 0) {
    return { kind: "none" };
  }

  const context: MaxRepsTotalContext = { totalReps: total };

  if (!existingPr) {
    return { kind: "create", value: new Prisma.Decimal(total), context };
  }

  if (existingPr.value.greaterThanOrEqualTo(total)) {
    return { kind: "none" };
  }

  return { kind: "update", value: new Prisma.Decimal(total), context };
};
