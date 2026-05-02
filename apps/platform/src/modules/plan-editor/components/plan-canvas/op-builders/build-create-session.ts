import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";

export type CreateSessionInput = {
  dayId: string;
  order?: number;
  label?: string;
  notes?: string;
};

export const buildCreateSession = (input: CreateSessionInput): BulkPatchOp => {
  const payload: { order?: number; label?: string; notes?: string } = {};

  if (input.order !== undefined) {
    payload.order = input.order;
  }

  if (input.label !== undefined) {
    payload.label = input.label;
  }

  if (input.notes !== undefined) {
    payload.notes = input.notes;
  }

  return {
    kind: "create-session",
    dayId: input.dayId,
    payload,
  };
};
