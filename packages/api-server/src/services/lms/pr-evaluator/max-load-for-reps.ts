import { Prisma, type PersonalRecord, type SetLog } from "@prisma/client";

import { extractLoadKg, parseActual } from "./_set-log-actual";

export interface MaxLoadForRepsContext {
  fixedReps: number;
}

export type MaxLoadForRepsDecision =
  | { kind: "create"; value: Prisma.Decimal; context: MaxLoadForRepsContext }
  | { kind: "update"; value: Prisma.Decimal; context: MaxLoadForRepsContext }
  | { kind: "none" };

export const detectMaxLoadForReps = (
  setLog: SetLog,
  existingPr: PersonalRecord | null,
): MaxLoadForRepsDecision => {
  const parsed = parseActual(setLog.actual);

  if (!parsed) {
    return { kind: "none" };
  }

  const candidateReps = parsed.reps;
  const candidateKg = extractLoadKg(parsed.load);

  if (typeof candidateReps !== "number" || candidateReps <= 0) {
    return { kind: "none" };
  }

  if (candidateKg === null || candidateKg <= 0) {
    return { kind: "none" };
  }

  if (!existingPr) {
    return {
      kind: "create",
      value: new Prisma.Decimal(candidateKg),
      context: { fixedReps: candidateReps },
    };
  }

  const existingContext = existingPr.context as { fixedReps?: number } | null;
  const existingReps = existingContext?.fixedReps;

  if (existingReps !== candidateReps) {
    return {
      kind: "update",
      value: new Prisma.Decimal(candidateKg),
      context: { fixedReps: candidateReps },
    };
  }

  if (existingPr.value.greaterThanOrEqualTo(candidateKg)) {
    return { kind: "none" };
  }

  return {
    kind: "update",
    value: new Prisma.Decimal(candidateKg),
    context: { fixedReps: candidateReps },
  };
};
