import { BadRequestError } from "@repo/errors";

type SchemaRowOrder = { id: string; rowGroupId: string | null; order: number };

export const assertRowGroupMembersContiguous = (
  rows: SchemaRowOrder[],
  rowGroupId: string,
): void => {
  const ordered = [...rows].sort((a, b) => a.order - b.order);
  const memberIndices = ordered.reduce<number[]>((acc, row, index) => {
    if (row.rowGroupId === rowGroupId) {
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
    throw new BadRequestError("Row group members must be a contiguous run within the schema", {
      rowGroupId,
      memberOrders: ordered.filter((r) => r.rowGroupId === rowGroupId).map((r) => r.order),
    });
  }
};
