import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";

import { type ApplyOutcome, type TxClient } from "./shared";

type CreateDayOp = Extract<BulkPatchOp, { kind: "create-day" }>;
type UpdateDayOp = Extract<BulkPatchOp, { kind: "update-day" }>;
type DeleteDayOp = Extract<BulkPatchOp, { kind: "delete-day" }>;

export const applyCreateDay = async (_tx: TxClient, _op: CreateDayOp): Promise<ApplyOutcome> => {
  throw new Error("not implemented: create-day");
};

export const applyUpdateDay = async (_tx: TxClient, _op: UpdateDayOp): Promise<ApplyOutcome> => {
  throw new Error("not implemented: update-day");
};

export const applyDeleteDay = async (_tx: TxClient, _op: DeleteDayOp): Promise<ApplyOutcome> => {
  throw new Error("not implemented: delete-day");
};
