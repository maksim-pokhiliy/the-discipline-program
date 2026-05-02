import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";

import { type ApplyOutcome, type TxClient } from "./shared";

type CreateWeekOp = Extract<BulkPatchOp, { kind: "create-week" }>;
type UpdateWeekOp = Extract<BulkPatchOp, { kind: "update-week" }>;
type DeleteWeekOp = Extract<BulkPatchOp, { kind: "delete-week" }>;

export const applyCreateWeek = async (_tx: TxClient, _op: CreateWeekOp): Promise<ApplyOutcome> => {
  throw new Error("not implemented: create-week");
};

export const applyUpdateWeek = async (_tx: TxClient, _op: UpdateWeekOp): Promise<ApplyOutcome> => {
  throw new Error("not implemented: update-week");
};

export const applyDeleteWeek = async (_tx: TxClient, _op: DeleteWeekOp): Promise<ApplyOutcome> => {
  throw new Error("not implemented: delete-week");
};
