import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";

export type DeleteSessionInput = {
  sessionId: string;
  expectedVersion: number;
};

export const buildDeleteSession = (input: DeleteSessionInput): BulkPatchOp => ({
  kind: "delete-session",
  sessionId: input.sessionId,
  expectedVersion: input.expectedVersion,
});
