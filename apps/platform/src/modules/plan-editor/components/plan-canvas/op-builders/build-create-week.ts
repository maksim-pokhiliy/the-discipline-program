import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";

export type CreateWeekInput = {
  planId: string;
  index: number;
  label?: string;
  notes?: string;
};

export const buildCreateWeek = (input: CreateWeekInput): BulkPatchOp => {
  const payload: { index: number; label?: string; notes?: string } = { index: input.index };

  if (input.label !== undefined) {
    payload.label = input.label;
  }

  if (input.notes !== undefined) {
    payload.notes = input.notes;
  }

  return {
    kind: "create-week",
    planId: input.planId,
    payload,
  };
};
