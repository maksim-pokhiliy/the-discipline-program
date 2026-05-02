import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";

import { type ApplyOutcome, type TxClient } from "./shared";

type CreateSessionOp = Extract<BulkPatchOp, { kind: "create-session" }>;
type UpdateSessionOp = Extract<BulkPatchOp, { kind: "update-session" }>;
type DeleteSessionOp = Extract<BulkPatchOp, { kind: "delete-session" }>;

export const applyCreateSession = async (
  _tx: TxClient,
  _op: CreateSessionOp,
): Promise<ApplyOutcome> => {
  throw new Error("not implemented: create-session");
};

export const applyUpdateSession = async (
  _tx: TxClient,
  _op: UpdateSessionOp,
): Promise<ApplyOutcome> => {
  throw new Error("not implemented: update-session");
};

export const applyDeleteSession = async (
  _tx: TxClient,
  _op: DeleteSessionOp,
): Promise<ApplyOutcome> => {
  throw new Error("not implemented: delete-session");
};
