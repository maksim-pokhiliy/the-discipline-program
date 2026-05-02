import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";

export type DeleteDayInput = {
  dayId: string;
  expectedVersion: number;
};

export const buildDeleteDay = (input: DeleteDayInput): BulkPatchOp => ({
  kind: "delete-day",
  dayId: input.dayId,
  expectedVersion: input.expectedVersion,
});
