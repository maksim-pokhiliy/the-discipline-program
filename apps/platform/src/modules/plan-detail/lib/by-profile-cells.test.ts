import { describe, expect, it } from "vitest";

import {
  type ByProfileAxis,
  type ByProfileCell,
  cellKgAtIndex,
  EMPTY_KG,
  regenerateCells,
  renameAxisValue,
  setCellKgByIndex,
} from "./by-profile-cells";

describe("regenerateCells", () => {
  it("builds one cell per single-axis value", () => {
    const axes: ByProfileAxis[] = [{ name: "level", values: ["RX", "SC"] }];

    expect(regenerateCells(axes, [])).toEqual([
      { coords: ["RX"], kg: EMPTY_KG },
      { coords: ["SC"], kg: EMPTY_KG },
    ]);
  });

  it("builds the cartesian product across two axes", () => {
    const axes: ByProfileAxis[] = [
      { name: "level", values: ["RX", "SC"] },
      { name: "sex", values: ["♂", "♀"] },
    ];

    expect(regenerateCells(axes, []).map((cell) => cell.coords)).toEqual([
      ["RX", "♂"],
      ["RX", "♀"],
      ["SC", "♂"],
      ["SC", "♀"],
    ]);
  });

  it("preserves an existing kg by matching coords when an axis value is added", () => {
    const axes: ByProfileAxis[] = [{ name: "level", values: ["RX", "SC", ""] }];
    const previous: ByProfileCell[] = [
      { coords: ["RX"], kg: 43 },
      { coords: ["SC"], kg: 30 },
    ];

    expect(regenerateCells(axes, previous)).toEqual([
      { coords: ["RX"], kg: 43 },
      { coords: ["SC"], kg: 30 },
      { coords: [""], kg: EMPTY_KG },
    ]);
  });
});

describe("renameAxisValue", () => {
  it("rewrites the matching coord in every cell of the renamed axis", () => {
    const cells: ByProfileCell[] = [
      { coords: ["RX", "♂"], kg: 9 },
      { coords: ["SC", "♂"], kg: 6 },
    ];

    expect(renameAxisValue(cells, 0, "RX", "Rx+")).toEqual([
      { coords: ["Rx+", "♂"], kg: 9 },
      { coords: ["SC", "♂"], kg: 6 },
    ]);
  });
});

describe("setCellKgByIndex", () => {
  it("updates the kg of the cell at the index and leaves others untouched", () => {
    const cells: ByProfileCell[] = [
      { coords: ["RX"], kg: 43 },
      { coords: ["SC"], kg: 30 },
    ];

    expect(setCellKgByIndex(cells, 1, 32)).toEqual([
      { coords: ["RX"], kg: 43 },
      { coords: ["SC"], kg: 32 },
    ]);
  });

  it("targets a two-axis cell by cartesian index regardless of coord values", () => {
    const cells: ByProfileCell[] = [
      { coords: ["RX", "M"], kg: 43 },
      { coords: ["RX", "F"], kg: EMPTY_KG },
      { coords: ["SC", "M"], kg: 30 },
      { coords: ["SC", "F"], kg: EMPTY_KG },
    ];

    expect(setCellKgByIndex(cells, 1, 30)[1]).toEqual({ coords: ["RX", "F"], kg: 30 });
  });
});

describe("cellKgAtIndex", () => {
  it("returns the kg of the cell at the index", () => {
    const cells: ByProfileCell[] = [{ coords: ["RX"], kg: 43 }];

    expect(cellKgAtIndex(cells, 0)).toBe(43);
  });

  it("falls back to the empty kg when the index is out of range", () => {
    expect(cellKgAtIndex([], 0)).toBe(EMPTY_KG);
  });
});
