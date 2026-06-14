import { describe, expect, it } from "vitest";

import { selectContiguousByListPosition } from "./select-contiguous";

const A = "id-a";
const B = "id-b";
const C = "id-c";

const item = (id: string, order: number): { id: string; order: number } => ({ id, order });

describe("selectContiguousByListPosition", () => {
  it("returns the selected ids in order for a contiguous run, regardless of input order", () => {
    const result = selectContiguousByListPosition(
      [item(B, 2), item(A, 1), item(C, 3)],
      new Set([A, B]),
    );

    expect(result).toStrictEqual({ ok: true, orderedIds: [A, B] });
  });

  it("is gap-tolerant: two list-adjacent items with an order gap are contiguous", () => {
    const result = selectContiguousByListPosition([item(A, 1), item(C, 5)], new Set([A, C]));

    expect(result).toStrictEqual({ ok: true, orderedIds: [A, C] });
  });

  it("fails when an unselected item sits between the selection by list position", () => {
    const result = selectContiguousByListPosition(
      [item(A, 1), item(B, 2), item(C, 3)],
      new Set([A, C]),
    );

    expect(result).toStrictEqual({ ok: false });
  });

  it("returns a single selected id as a trivially contiguous run", () => {
    const result = selectContiguousByListPosition([item(A, 1), item(B, 2)], new Set([A]));

    expect(result).toStrictEqual({ ok: true, orderedIds: [A] });
  });

  it("fails for an empty selection", () => {
    const result = selectContiguousByListPosition([item(A, 1), item(B, 2)], new Set());

    expect(result).toStrictEqual({ ok: false });
  });
});
