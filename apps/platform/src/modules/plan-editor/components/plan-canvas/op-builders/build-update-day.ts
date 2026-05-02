import { type DayKind } from "@repo/contracts/lms/_domain";
import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";

export type UpdateDayInput = {
  dayId: string;
  expectedVersion: number;
  kind?: DayKind;
  notes?: string | null;
};

export const buildUpdateDay = (input: UpdateDayInput): BulkPatchOp => {
  const fullEntity: { kind?: DayKind; notes?: string | null } = {};

  if (input.kind !== undefined) {
    fullEntity.kind = input.kind;
  }

  if (input.notes !== undefined) {
    fullEntity.notes = input.notes;
  }

  return {
    kind: "update-day",
    dayId: input.dayId,
    expectedVersion: input.expectedVersion,
    fullEntity,
  };
};
