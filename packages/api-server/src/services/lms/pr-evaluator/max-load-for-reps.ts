import { Prisma, type PersonalRecord, type SetLog } from "@prisma/client";

import { type LoadSpec } from "@repo/contracts/lms/_domain";

export interface MaxLoadForRepsContext {
  fixedReps: number;
}

export type MaxLoadForRepsDecision =
  | { kind: "create"; value: Prisma.Decimal; context: MaxLoadForRepsContext }
  | { kind: "update"; value: Prisma.Decimal; context: MaxLoadForRepsContext }
  | { kind: "none" };

interface SetLogActual {
  load?: LoadSpec;
  reps?: number;
}

const extractLoadKg = (load: LoadSpec | undefined): number | null => {
  if (!load) {
    return null;
  }

  switch (load.kind) {
    case "SINGLE_DB":
    case "KB":
    case "BARBELL": {
      return load.kg;
    }
    case "DOUBLE_DB": {
      return load.kgEach;
    }
    default: {
      return null;
    }
  }
};

const parseActual = (actual: SetLog["actual"]): SetLogActual | null => {
  if (typeof actual !== "object" || actual === null || Array.isArray(actual)) {
    return null;
  }

  return actual as unknown as SetLogActual;
};

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
