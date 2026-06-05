import { type RowKind } from "@repo/contracts/lms/schema-row";
import { BadRequestError } from "@repo/errors";

export const assertRowKindPayloadAlignment = (
  flatRowKind: RowKind,
  payloadRowKind: RowKind,
): void => {
  if (flatRowKind !== payloadRowKind) {
    throw new BadRequestError("rowPayload.rowKind must match flat rowKind", {
      flatRowKind,
      payloadRowKind,
    });
  }
};
