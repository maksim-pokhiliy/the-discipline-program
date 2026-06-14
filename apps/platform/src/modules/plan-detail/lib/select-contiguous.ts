const CONTIGUITY_SPAN_OFFSET = 1;

export type SelectContiguousResult = { ok: true; orderedIds: string[] } | { ok: false };

export const selectContiguousByListPosition = <T extends { id: string; order: number }>(
  items: T[],
  selectedIds: ReadonlySet<string>,
): SelectContiguousResult => {
  const sorted = [...items].sort((a, b) => a.order - b.order);

  const selectedInOrder = sorted
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => selectedIds.has(item.id));

  const first = selectedInOrder[0];
  const last = selectedInOrder[selectedInOrder.length - 1];

  const isContiguous =
    first !== undefined &&
    last !== undefined &&
    last.index - first.index + CONTIGUITY_SPAN_OFFSET === selectedInOrder.length;

  if (!isContiguous) {
    return { ok: false };
  }

  return { ok: true, orderedIds: selectedInOrder.map(({ item }) => item.id) };
};
