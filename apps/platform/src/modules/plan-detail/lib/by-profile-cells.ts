import { type Load } from "@repo/contracts/lms/_shared";

export type ByProfileLoad = Extract<Load, { kind: "byProfile" }>;
export type ByProfileAxis = ByProfileLoad["axes"][number];
export type ByProfileCell = ByProfileLoad["cells"][number];

export const EMPTY_KG = Number.NaN;

const COORD_KEY_SEPARATOR = "|";

const coordKey = (coords: readonly string[]): string => coords.join(COORD_KEY_SEPARATOR);

const cartesianCoords = (axes: readonly ByProfileAxis[]): string[][] =>
  axes.reduce<string[][]>(
    (tuples, axis) => tuples.flatMap((tuple) => axis.values.map((value) => [...tuple, value])),
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

export const renameAxisValue = (
  cells: readonly ByProfileCell[],
  axisIndex: number,
  previousValue: string,
  nextValue: string,
): ByProfileCell[] =>
  cells.map((cell) => ({
    ...cell,
    coords: cell.coords.map((coord, index) =>
      index === axisIndex && coord === previousValue ? nextValue : coord,
    ),
  }));

export const setCellKg = (
  cells: readonly ByProfileCell[],
  coords: readonly string[],
  kg: number,
): ByProfileCell[] =>
  cells.map((cell) => (coordKey(cell.coords) === coordKey(coords) ? { ...cell, kg } : cell));

export const cellKgAt = (cells: readonly ByProfileCell[], coords: readonly string[]): number => {
  const match = cells.find((cell) => coordKey(cell.coords) === coordKey(coords));

  return match?.kg ?? EMPTY_KG;
};
