import { type ArrangementAxis, type Composition } from "@repo/contracts/lms/composition";
import { BadRequestError, NotFoundError } from "@repo/errors";

import { assertComposeTreeValidForWrite, buildSchemaWithBody } from "../../../mappers/lms";
import { type TxClient } from "../_shared";

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
