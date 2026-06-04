import { type Composition } from "@repo/contracts/lms/composition";
import { type SchemaKind, SUB_SCHEMA_ALLOWED_KINDS } from "@repo/contracts/lms/schema";
import { BadRequestError, NotFoundError } from "@repo/errors";

import { assertComposeTreeValidForWrite, buildSchemaWithBody } from "../../../mappers/lms";
import { type TxClient } from "../_shared";

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

export const assertCompositionUpdateValid = async (
  client: TxClient,
  schemaId: string,
  nextComposition: Composition | null,
): Promise<void> => {
  const current = await client.schema.findUnique({
    where: { id: schemaId },
    include: {
      rows: { orderBy: { order: "asc" } },
      subSchemas: {
        orderBy: { order: "asc" },
        include: { rows: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!current) {
    throw new NotFoundError("Schema not found", { schemaId });
  }

  const node = buildSchemaWithBody(current);

  assertComposeTreeValidForWrite({
    ...node,
    schema: { ...node.schema, composition: nextComposition },
  });
};

export const assertSubSchemaInvariants = (
  parentKind: SchemaKind | null,
  dataKind: SchemaKind | null,
): void => {
  if (parentKind === null || dataKind === null) {
    return;
  }

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
