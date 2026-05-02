import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";

export type UpdateWeekInput = {
  weekId: string;
  expectedVersion: number;
  index?: number;
  label?: string | null;
  notes?: string | null;
};

export const buildUpdateWeek = (input: UpdateWeekInput): BulkPatchOp => {
  const fullEntity: { index?: number; label?: string | null; notes?: string | null } = {};

  if (input.index !== undefined) {
    fullEntity.index = input.index;
  }

  if (input.label !== undefined) {
    fullEntity.label = input.label;
  }

  if (input.notes !== undefined) {
    fullEntity.notes = input.notes;
  }

  return {
    kind: "update-week",
    weekId: input.weekId,
    expectedVersion: input.expectedVersion,
    fullEntity,
  };
};
