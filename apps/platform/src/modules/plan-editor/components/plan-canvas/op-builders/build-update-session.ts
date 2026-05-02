import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";

export type UpdateSessionInput = {
  sessionId: string;
  expectedVersion: number;
  order?: number;
  label?: string | null;
  notes?: string | null;
};

export const buildUpdateSession = (input: UpdateSessionInput): BulkPatchOp => {
  const fullEntity: { order?: number; label?: string | null; notes?: string | null } = {};

  if (input.order !== undefined) {
    fullEntity.order = input.order;
  }

  if (input.label !== undefined) {
    fullEntity.label = input.label;
  }

  if (input.notes !== undefined) {
    fullEntity.notes = input.notes;
  }

  return {
    kind: "update-session",
    sessionId: input.sessionId,
    expectedVersion: input.expectedVersion,
    fullEntity,
  };
};
