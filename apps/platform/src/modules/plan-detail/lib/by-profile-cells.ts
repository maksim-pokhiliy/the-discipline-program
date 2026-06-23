import { type Load } from "@repo/contracts/lms/_shared";

export type ByProfileLoad = Extract<Load, { kind: "byProfile" }>;
export type ByProfileAxis = ByProfileLoad["axes"][number];
export type ByProfileCell = ByProfileLoad["cells"][number];

export const EMPTY_KG = Number.NaN;

const AXIS_FALLBACK_LABEL = "Axis";

const COORD_KEY_SEPARATOR = "|";

export const axisValues = (axis: ByProfileAxis): readonly string[] => axis.values;

export const axisLabel = (axis: ByProfileAxis): string =>
  axis.label === "" ? AXIS_FALLBACK_LABEL : axis.label;

export const makeAxisDraft = (): ByProfileAxis => ({
  axisId: "",
  label: "",
  values: [],
  binding: null,
});

const coordKey = (coords: readonly string[]): string => coords.join(COORD_KEY_SEPARATOR);

const cartesianCoords = (axes: readonly ByProfileAxis[]): string[][] =>
  axes.reduce<string[][]>(
    (tuples, axis) => tuples.flatMap((tuple) => axisValues(axis).map((value) => [...tuple, value])),
    [[]],
  );

export const regenerateCells = (
  axes: readonly ByProfileAxis[],
  previousCells: readonly ByProfileCell[],
): ByProfileCell[] => {
  const kgByCoords = new Map(previousCells.map((cell) => [coordKey(cell.coords), cell.kg]));

  return cartesianCoords(axes).map((coords) => ({
    coords,
    kg: kgByCoords.get(coordKey(coords)) ?? EMPTY_KG,
  }));
};

export const setCellKgByIndex = (
  cells: readonly ByProfileCell[],
  index: number,
  kg: number,
): ByProfileCell[] =>
  cells.map((cell, cellIndex) => (cellIndex === index ? { ...cell, kg } : cell));

export const cellKgAtIndex = (cells: readonly ByProfileCell[], index: number): number =>
  cells[index]?.kg ?? EMPTY_KG;
