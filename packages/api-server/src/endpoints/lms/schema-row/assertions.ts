import { type SchemaKind } from "@repo/contracts/lms/schema";
import { type RowKind } from "@repo/contracts/lms/schema-row";
import { BadRequestError } from "@repo/errors";

const SCHEMA_KINDS_ALLOWING_ROWS = ["ATOMIC", "HEADERLESS", "NAMED", "COMPOSITE"] as const;

export const assertParentKindForRow = (parentKind: SchemaKind | null): void => {
  if (parentKind === null) {
    return;
  }

  const allowed: readonly string[] = SCHEMA_KINDS_ALLOWING_ROWS;

  if (!allowed.includes(parentKind)) {
    throw new BadRequestError(
      "SchemaRow cannot be added to NESTED schema body — add a sub-schema instead",
      { parentKind, allowed: SCHEMA_KINDS_ALLOWING_ROWS },
    );
  }
};

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
