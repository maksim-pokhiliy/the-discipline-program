import { type SetLog } from "@prisma/client";

import { type LoadSpec } from "@repo/contracts/lms/_domain";
import { type SetActualResult, setActualResultSchema } from "@repo/contracts/lms/set-log";

export type SetLogActual = SetActualResult;

export const parseActual = (actual: SetLog["actual"]): SetLogActual | null => {
  const result = setActualResultSchema.safeParse(actual);

  return result.success ? result.data : null;
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
