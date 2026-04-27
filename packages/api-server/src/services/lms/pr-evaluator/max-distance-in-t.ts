import { Prisma, type PersonalRecord, type SetLog } from "@prisma/client";

import { parseActual } from "./_set-log-actual";

export interface MaxDistanceInTContext {
  timeSec: number | undefined;
}

export type MaxDistanceInTDecision =
  | { kind: "create"; value: Prisma.Decimal; context: MaxDistanceInTContext }
  | { kind: "update"; value: Prisma.Decimal; context: MaxDistanceInTContext }
  | { kind: "none" };

export const detectMaxDistanceInT = (
  setLog: SetLog,
  existingPr: PersonalRecord | null,
): MaxDistanceInTDecision => {
  const parsed = parseActual(setLog.actual);

  if (!parsed) {
    return { kind: "none" };
  }

  const distanceM = parsed.distanceM;

  if (typeof distanceM !== "number") {
    return { kind: "none" };
  }

  const context: MaxDistanceInTContext = { timeSec: parsed.durationSec };

  if (!existingPr) {
    return { kind: "create", value: new Prisma.Decimal(distanceM), context };
  }

  if (existingPr.value.greaterThanOrEqualTo(distanceM)) {
    return { kind: "none" };
  }

  return { kind: "update", value: new Prisma.Decimal(distanceM), context };
};
