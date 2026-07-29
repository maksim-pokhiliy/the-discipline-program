import {
  type Gender,
  type UpdateAthleteProfileRequest,
} from "@repo/contracts/coaching/athlete-profile";
import { type RowView } from "@repo/contracts/lms/session-detail";

import { type LevelAxis, shortenGraphemes, toLevelAxes } from "@app/lib/level-switch";

import { GENDER_BY_COORD } from "./gender-coord-map";
import {
  RECEIPT_COORD_MAX_CHARS,
  RECEIPT_COORD_SEPARATOR,
  RECEIPT_LEVEL_APPLIED,
  RECEIPT_LEVEL_SUFFIX_PLURAL,
  RECEIPT_LEVEL_SUFFIX_SINGULAR,
  RECEIPT_MAX_INFIX,
  RECEIPT_MAX_SUFFIX,
} from "./weight-sheet.constants";

export type LevelDraft = {
  selections: Record<string, string>;
  gender: Gender | null;
};

const SINGLE_WEIGHT_COUNT = 1;
const NO_AXES: LevelAxis[] = [];

export const parseOneRm = (raw: string): number | null => {
  const parsed = Number(raw.trim());

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const shortenReceiptCoordinate = (value: string): string =>
  shortenGraphemes(value, RECEIPT_COORD_MAX_CHARS);

export const levelAxesOf = (row: RowView | null): LevelAxis[] => {
  const load = row?.load ?? null;

  return load !== null && load.kind === "byProfile" ? toLevelAxes(load.axes) : NO_AXES;
};

const coordinateOf = (axis: LevelAxis, draft: LevelDraft): string | null => {
  if (axis.binding === "GENDER") {
    return axis.values.find((value) => GENDER_BY_COORD[value] === draft.gender) ?? null;
  }

  const picked = draft.selections[axis.id];

  return picked !== undefined && axis.values.includes(picked) ? picked : null;
};

export const coordinatesOf = (axes: LevelAxis[], draft: LevelDraft): Record<string, string> =>
  Object.fromEntries(
    axes
      .map((axis) => [axis.id, coordinateOf(axis, draft)] as const)
      .filter((entry): entry is readonly [string, string] => entry[1] !== null),
  );

export const buildLevelPatch = (
  axes: LevelAxis[],
  coordinates: Record<string, string>,
  savedSelections: Record<string, string>,
): UpdateAthleteProfileRequest | null => {
  if (axes.length === 0) {
    return null;
  }

  const selections: Record<string, string> = { ...savedSelections };
  let gender: Gender | undefined;

  for (const axis of axes) {
    const value = coordinates[axis.id];

    if (value === undefined) {
      return null;
    }

    if (axis.binding === null) {
      selections[axis.id] = value;
      continue;
    }

    const mapped = GENDER_BY_COORD[value];

    if (mapped === undefined) {
      return null;
    }

    gender = mapped;
  }

  return { profileSelections: selections, ...(gender !== undefined && { gender }) };
};

export const buildLevelReceipt = (coordinates: string[], weightCount: number): string => {
  const named = coordinates.map(shortenReceiptCoordinate).join(RECEIPT_COORD_SEPARATOR);
  const suffix =
    weightCount === SINGLE_WEIGHT_COUNT
      ? RECEIPT_LEVEL_SUFFIX_SINGULAR
      : RECEIPT_LEVEL_SUFFIX_PLURAL;

  return `${named}${RECEIPT_LEVEL_APPLIED}${weightCount}${suffix}`;
};

export const buildMaxReceipt = (movement: string, valueKg: number): string =>
  `${movement}${RECEIPT_MAX_INFIX}${valueKg}${RECEIPT_MAX_SUFFIX}`;

export const exerciseOf = (row: RowView): string | null => {
  const { resolvedLoad } = row;

  if (resolvedLoad === null) {
    return null;
  }

  switch (resolvedLoad.status) {
    case "resolved": {
      const { source } = resolvedLoad;

      return source !== undefined && source.kind === "one_rm" ? source.exerciseId : null;
    }
    case "unresolved":
      return resolvedLoad.reason === "missing_one_rm" ? resolvedLoad.exerciseId : null;
    case "bodyweight":
    case "not_applicable":
      return null;
    default:
      resolvedLoad satisfies never;

      return null;
  }
};
