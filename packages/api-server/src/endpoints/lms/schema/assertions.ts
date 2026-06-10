import { type ArrangementAxis, type Composition } from "@repo/contracts/lms/composition";
import { BadRequestError, NotFoundError } from "@repo/errors";

import { assertComposeTreeValidForWrite, buildSchemaSubtree } from "../../../mappers/lms";
import { type TxClient } from "../_shared";

export const assertArrangementRefsInScope = (
  arrangement: ArrangementAxis,
  directRowIds: ReadonlySet<string>,
): void => {
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
    select: { id: true, blockId: true },
  });

  if (!current) {
    throw new NotFoundError("Schema not found", { schemaId });
  }

  const flat = await client.schema.findMany({
    where: { blockId: current.blockId },
    include: { rows: { orderBy: { order: "asc" } } },
  });
  const node = buildSchemaSubtree(flat, schemaId);

  assertComposeTreeValidForWrite({
    ...node,
    schema: { ...node.schema, composition: nextComposition },
  });

  const arrangement = nextComposition?.arrangement;

  if (arrangement !== undefined && arrangement.kind !== "ordered") {
    const directRowIds = new Set(node.rows.map((row) => row.id));

    assertArrangementRefsInScope(arrangement, directRowIds);
  }
};
