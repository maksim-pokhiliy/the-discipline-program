import { BadRequestError } from "@repo/errors";

import { type TxClient } from "../_shared";

const ORDER_STEP = 10;

export const nextRowOrderInSchema = async (tx: TxClient, schemaId: string): Promise<number> => {
  const max = await tx.schemaRow.aggregate({ where: { schemaId }, _max: { order: true } });

  return (max._max.order ?? 0) + ORDER_STEP;
};

export const resolveRowGroupedOrder = async (
  tx: TxClient,
  schemaId: string,
  rowGroupId: string,
): Promise<number> => {
  const group = await tx.rowGroup.findUnique({
    where: { id: rowGroupId },
    select: { schemaId: true },
  });

  if (group === null || group.schemaId !== schemaId) {
    throw new BadRequestError("Row group does not belong to the target schema", {
      rowGroupId,
      schemaId,
    });
  }

  const schemaRows = await tx.schemaRow.findMany({
    where: { schemaId },
    select: { id: true, order: true, rowGroupId: true },
  });
  const memberOrders = schemaRows
    .filter((r) => r.rowGroupId === rowGroupId)
    .map((r) => r.order)
    .sort((a, b) => a - b);

  if (memberOrders.length === 0) {
    return nextRowOrderInSchema(tx, schemaId);
  }

  const lastMemberOrder = memberOrders[memberOrders.length - 1] ?? 0;

  const shifted = schemaRows
    .filter((r) => r.order > lastMemberOrder)
    .sort((a, b) => b.order - a.order);

  for (const r of shifted) {
    await tx.schemaRow.update({ where: { id: r.id }, data: { order: r.order + ORDER_STEP } });
  }

  return lastMemberOrder + ORDER_STEP;
};
