import { type SetLog } from "@prisma/client";

import { type LoadSpec } from "@repo/contracts/lms/_domain";

export interface SetLogActual {
  load?: LoadSpec;
  reps?: number;
  durationSec?: number;
  distanceM?: number;
  calories?: number;
}

export const parseActual = (actual: SetLog["actual"]): SetLogActual | null => {
  if (typeof actual !== "object" || actual === null || Array.isArray(actual)) {
    return null;
  }

  return actual as unknown as SetLogActual;
};

export const extractLoadKg = (load: LoadSpec | undefined): number | null => {
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
