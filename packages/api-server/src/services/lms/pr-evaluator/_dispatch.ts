import {
  type PersonalRecord as PrismaPersonalRecord,
  type Prisma,
  type PrismaClient,
  type SetLog,
  PrKind,
} from "@prisma/client";

import { detectBestTimeForX } from "./best-time-for-x";
import { detectMaxCaloriesInT } from "./max-calories-in-t";
import { detectMaxDistanceInT } from "./max-distance-in-t";
import { detectMaxLoadForReps } from "./max-load-for-reps";
import { detectMaxRepsTotal } from "./max-reps-total";
import { detectMaxRepsUnbroken } from "./max-reps-unbroken";
import { detectNRepMax } from "./n-rep-max";
import { detectOneRepMax } from "./one-rep-max";

interface DispatchInput {
  prKind: PrKind;
  setLog: SetLog;
  siblings: SetLog[] | null;
  existing: PrismaPersonalRecord | null;
}

interface DispatchOutput {
  value: Prisma.Decimal | number;
  unit: string;
  context: Prisma.InputJsonValue;
}

export const dispatchDetector = ({
  prKind,
  setLog,
  siblings,
  existing,
}: DispatchInput): DispatchOutput | null => {
  switch (prKind) {
    case PrKind.MAX_LOAD_FOR_REPS: {
      const d = detectMaxLoadForReps(setLog, existing);

      return d.kind === "none"
        ? null
        : { value: d.value, unit: "kg", context: { fixedReps: d.context.fixedReps } };
    }

    case PrKind.ONE_REP_MAX: {
      const d = detectOneRepMax(setLog, existing);

      return d.kind === "none"
        ? null
        : {
            value: d.value,
            unit: "kg",
            context: { load: d.context.load, reps: d.context.reps, formula: d.context.formula },
          };
    }

    case PrKind.N_REP_MAX: {
      const d = detectNRepMax(setLog, existing);

      return d.kind === "none"
        ? null
        : { value: d.value, unit: "kg", context: { targetReps: d.context.targetReps } };
    }

    case PrKind.MAX_REPS_UNBROKEN: {
      const sibs = siblings ?? [setLog];
      const setIndex = sibs.findIndex((s) => s.id === setLog.id);
      const d = detectMaxRepsUnbroken(setLog, existing, setIndex >= 0 ? setIndex : setLog.order);

      return d.kind === "none"
        ? null
        : { value: d.value, unit: "reps", context: { setIndex: d.context.setIndex } };
    }

    case PrKind.MAX_REPS_TOTAL: {
      const sibs = siblings ?? [setLog];
      const d = detectMaxRepsTotal(sibs, existing);

      return d.kind === "none"
        ? null
        : { value: d.value, unit: "reps", context: { totalReps: d.context.totalReps } };
    }

    case PrKind.BEST_TIME_FOR_X: {
      const d = detectBestTimeForX(setLog, existing);

      return d.kind === "none"
        ? null
        : {
            value: d.value,
            unit: "sec",
            context: {
              targetReps: d.context.targetReps ?? null,
              targetDistanceM: d.context.targetDistanceM ?? null,
            },
          };
    }

    case PrKind.MAX_DISTANCE_IN_T: {
      const d = detectMaxDistanceInT(setLog, existing);

      return d.kind === "none"
        ? null
        : { value: d.value, unit: "m", context: { timeSec: d.context.timeSec ?? null } };
    }

    case PrKind.MAX_CALORIES_IN_T: {
      const d = detectMaxCaloriesInT(setLog, existing);

      return d.kind === "none"
        ? null
        : { value: d.value, unit: "cal", context: { timeSec: d.context.timeSec ?? null } };
    }

    default: {
      const _exhaustive: never = prKind;

      throw new Error(`unhandled PrKind: ${String(_exhaustive)}`);
    }
  }
};

export const upsertPersonalRecord = async (
  db: PrismaClient | Prisma.TransactionClient,
  args: {
    userId: string;
    exerciseId: string;
    prKind: PrKind;
    setLogId: string;
    achievedAt: Date;
    output: DispatchOutput;
  },
): Promise<PrismaPersonalRecord> => {
  const { userId, exerciseId, prKind, setLogId, achievedAt, output } = args;
  const where = { userId_exerciseId_kind: { userId, exerciseId, kind: prKind } };
  const data = {
    value: output.value,
    unit: output.unit,
    context: output.context,
    achievedAt,
    sourceSetLogId: setLogId,
  };

  return db.personalRecord.upsert({
    where,
    create: { userId, exerciseId, kind: prKind, ...data },
    update: data,
  });
};
