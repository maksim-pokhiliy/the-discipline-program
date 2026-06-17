import { describe, expect, it } from "vitest";

import {
  type ByProfileAxis,
  type ByProfileCell,
  cellKgAt,
  EMPTY_KG,
  regenerateCells,
  renameAxisValue,
  setCellKg,
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

describe("setCellKg", () => {
  it("updates the kg of the cell matching the coords and leaves others untouched", () => {
    const cells: ByProfileCell[] = [
      { coords: ["RX"], kg: 43 },
      { coords: ["SC"], kg: 30 },
    ];

    expect(setCellKg(cells, ["SC"], 32)).toEqual([
      { coords: ["RX"], kg: 43 },
      { coords: ["SC"], kg: 32 },
    ]);
  });
});

describe("cellKgAt", () => {
  it("returns the kg of the matching cell", () => {
    const cells: ByProfileCell[] = [{ coords: ["RX"], kg: 43 }];

    expect(cellKgAt(cells, ["RX"])).toBe(43);
  });

  it("falls back to the empty kg when no cell matches", () => {
    expect(cellKgAt([], ["RX"])).toBe(EMPTY_KG);
  });
});
