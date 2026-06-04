import { type ArrangementAxis, type Composition } from "@repo/contracts/lms/composition";
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

export const assertArrangementRefsInScope = (
  arrangement: ArrangementAxis,
  directSchemaIds: ReadonlySet<string>,
  directRowIds: ReadonlySet<string>,
  grandchildRowIds: ReadonlySet<string>,
): void => {
  if (arrangement.kind === "parallel") {
    for (const track of arrangement.tracks) {
      if (!directSchemaIds.has(track.childSchemaId)) {
        throw new BadRequestError("arrangement track childSchemaId is not a child of this schema", {
          childSchemaId: track.childSchemaId,
        });
      }

      if (track.pairedWithRowId !== undefined && !grandchildRowIds.has(track.pairedWithRowId)) {
        throw new BadRequestError("arrangement pairedWithRowId is not a row of any track", {
          pairedWithRowId: track.pairedWithRowId,
        });
      }
    }

    return;
  }

  if (arrangement.kind === "superset") {
    for (const pair of arrangement.pairs) {
      for (const rowId of pair.rowIds) {
        if (!directRowIds.has(rowId)) {
          throw new BadRequestError("arrangement superset rowId is not a row of this schema", {
            rowId,
          });
        }
      }
    }
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

  const arrangement = nextComposition?.arrangement;

  if (arrangement !== undefined && arrangement.kind !== "ordered") {
    const directSchemaIds = new Set(current.subSchemas.map((sub) => sub.id));
    const directRowIds = new Set(current.rows.map((row) => row.id));
    const grandchildRowIds = new Set(
      current.subSchemas.flatMap((sub) => sub.rows.map((row) => row.id)),
    );

    assertArrangementRefsInScope(arrangement, directSchemaIds, directRowIds, grandchildRowIds);
  }
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
