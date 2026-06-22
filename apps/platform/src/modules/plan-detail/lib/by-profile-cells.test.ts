import { describe, expect, it } from "vitest";

import {
  axisLabel,
  axisValues,
  type ByProfileAxis,
  type ByProfileCell,
  cellKgAtIndex,
  EMPTY_KG,
  GENDER_AXIS_LABEL,
  makeCatalogAxisDraft,
  regenerateCells,
  setCellKgByIndex,
} from "./by-profile-cells";

const AXIS_ID_LEVEL = "clp9z8x7w0000abcd12axlevel";
const AXIS_ID_SEX = "clp9z8x7w0000abcd12ax00sex";

const catalogAxis = (axisId: string, label: string, values: string[]): ByProfileAxis => ({
  kind: "catalog",
  axisId,
  label,
  values,
});

const humanAxis: ByProfileAxis = { kind: "human", attribute: "gender" };

describe("axisValues", () => {
  it("returns the snapshot values for a catalog axis", () => {
    expect(axisValues(catalogAxis(AXIS_ID_LEVEL, "Level", ["RX", "SC"]))).toEqual(["RX", "SC"]);
  });

  it("returns the fixed gender vocabulary for a human axis", () => {
    expect(axisValues(humanAxis)).toEqual(["Male", "Female"]);
  });
});

describe("axisLabel", () => {
  it("returns the snapshot label for a bound catalog axis", () => {
    expect(axisLabel(catalogAxis(AXIS_ID_LEVEL, "Level", ["RX"]))).toBe("Level");
  });

  it("falls back to a placeholder for an unbound catalog axis", () => {
    expect(axisLabel(makeCatalogAxisDraft())).toBe("Axis");
  });

  it("returns the gender label for a human axis", () => {
    expect(axisLabel(humanAxis)).toBe(GENDER_AXIS_LABEL);
  });
});

describe("makeCatalogAxisDraft", () => {
  it("produces an unbound catalog axis", () => {
    expect(makeCatalogAxisDraft()).toEqual({ kind: "catalog", axisId: "", label: "", values: [] });
  });
});

describe("regenerateCells", () => {
  it("builds one cell per single catalog-axis value", () => {
    const axes: ByProfileAxis[] = [catalogAxis(AXIS_ID_LEVEL, "Level", ["RX", "SC"])];

    expect(regenerateCells(axes, [])).toEqual([
      { coords: ["RX"], kg: EMPTY_KG },
      { coords: ["SC"], kg: EMPTY_KG },
    ]);
  });

  it("builds the cartesian product across two catalog axes", () => {
    const axes: ByProfileAxis[] = [
      catalogAxis(AXIS_ID_LEVEL, "Level", ["RX", "SC"]),
      catalogAxis(AXIS_ID_SEX, "Sex", ["♂", "♀"]),
    ];

    expect(regenerateCells(axes, []).map((cell) => cell.coords)).toEqual([
      ["RX", "♂"],
      ["RX", "♀"],
      ["SC", "♂"],
      ["SC", "♀"],
    ]);
  });

  it("seeds gender cells from the fixed const for a human axis", () => {
    expect(regenerateCells([humanAxis], []).map((cell) => cell.coords)).toEqual([
      ["Male"],
      ["Female"],
    ]);
  });

  it("preserves an existing kg by matching coords when an axis value is added", () => {
    const axes: ByProfileAxis[] = [catalogAxis(AXIS_ID_LEVEL, "Level", ["RX", "SC", "MA"])];
    const previous: ByProfileCell[] = [
      { coords: ["RX"], kg: 43 },
      { coords: ["SC"], kg: 30 },
    ];

    expect(regenerateCells(axes, previous)).toEqual([
      { coords: ["RX"], kg: 43 },
      { coords: ["SC"], kg: 30 },
      { coords: ["MA"], kg: EMPTY_KG },
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
