import { type DayKind, type DayOfWeek } from "@repo/contracts/lms/_domain";
import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";

export type CreateDayInput = {
  weekId: string;
  dayOfWeek: DayOfWeek;
  kind?: DayKind;
  notes?: string;
};

export const buildCreateDay = (input: CreateDayInput): BulkPatchOp => {
  const payload: { dayOfWeek: DayOfWeek; kind?: DayKind; notes?: string } = {
    dayOfWeek: input.dayOfWeek,
  };

  if (input.kind !== undefined) {
    payload.kind = input.kind;
  }

  if (input.notes !== undefined) {
    payload.notes = input.notes;
  }

  return {
    kind: "create-day",
    weekId: input.weekId,
    payload,
  };
};
