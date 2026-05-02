import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";

export type DeleteWeekInput = {
  weekId: string;
  expectedVersion: number;
};

export const buildDeleteWeek = (input: DeleteWeekInput): BulkPatchOp => ({
  kind: "delete-week",
  weekId: input.weekId,
  expectedVersion: input.expectedVersion,
});
