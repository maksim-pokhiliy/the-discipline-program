import { type SchemaKind, SUB_SCHEMA_ALLOWED_KINDS } from "@repo/contracts/lms/schema";
import { BadRequestError, NotFoundError } from "@repo/errors";

import { type prisma } from "../../../db/client";

type TxClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export const assertArchetypeConsistency = async (
  tx: TxClient,
  archetypeId: string,
  dataKind: SchemaKind,
  paramsArchetype: string,
): Promise<void> => {
  const archetype = await tx.archetype.findUnique({
    where: { id: archetypeId },
    select: { id: true, name: true, kind: true },
  });

  if (!archetype) {
    throw new NotFoundError("Archetype not found", { archetypeId });
  }

  if (archetype.kind !== dataKind) {
    throw new BadRequestError("Schema kind does not match Archetype kind", {
      dataKind,
      archetypeKind: archetype.kind,
      archetypeName: archetype.name,
    });
  }

  if (paramsArchetype !== archetype.name) {
    throw new BadRequestError("archetypeParams variant does not match Archetype", {
      paramsArchetype,
      archetypeName: archetype.name,
    });
  }
};

export const assertSubSchemaInvariants = (parentKind: SchemaKind, dataKind: SchemaKind): void => {
  if (parentKind !== "NESTED") {
    throw new BadRequestError("Cannot nest schemas under non-NESTED parent kind", {
      parentKind,
    });
  }

  const subAllowed: readonly string[] = SUB_SCHEMA_ALLOWED_KINDS;

  if (!subAllowed.includes(dataKind)) {
    throw new BadRequestError("Sub-schema kind must be ATOMIC or HEADERLESS", {
      dataKind,
      allowed: SUB_SCHEMA_ALLOWED_KINDS,
    });
  }
};
