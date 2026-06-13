import { type Composition } from "@repo/contracts/lms/composition";
import { BadRequestError, NotFoundError } from "@repo/errors";

import { assertComposeTreeValidForWrite, mapToSchemaWithBody } from "../../../mappers/lms";
import { SCHEMA_BODY_INCLUDE, type TxClient } from "../_shared";

type BlockSchemaOrder = { id: string; groupId: string | null; order: number };

export const assertGroupMembersContiguous = (
  blockSchemas: BlockSchemaOrder[],
  groupId: string,
): void => {
  const ordered = [...blockSchemas].sort((a, b) => a.order - b.order);
  const memberIndices = ordered.reduce<number[]>((acc, schema, index) => {
    if (schema.groupId === groupId) {
      acc.push(index);
    }

    return acc;
  }, []);

  if (memberIndices.length === 0) {
    return;
  }

  const first = memberIndices[0] ?? 0;
  const last = memberIndices[memberIndices.length - 1] ?? 0;
  const isContiguous = last - first + 1 === memberIndices.length;

  if (!isContiguous) {
    throw new BadRequestError("Group members must be a contiguous run within the block", {
      groupId,
      memberOrders: ordered.filter((s) => s.groupId === groupId).map((s) => s.order),
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
    include: SCHEMA_BODY_INCLUDE,
  });

  if (!current) {
    throw new NotFoundError("Schema not found", { schemaId });
  }

  const node = mapToSchemaWithBody(current);

  assertComposeTreeValidForWrite({
    ...node,
    schema: { ...node.schema, composition: nextComposition },
  });
};
