import { type QueryKey } from "@tanstack/react-query";

import {
  type Gender,
  type UpdateAthleteProfileRequest,
} from "@repo/contracts/coaching/athlete-profile";
import { kgSchema } from "@repo/contracts/lms/_shared";
import { type RowView } from "@repo/contracts/lms/session-detail";

import {
  buildAppliedMessage,
  buildFailedMessage,
  type LevelAxis,
  shortenGraphemes,
  toLevelAxes,
} from "@app/lib/level-switch";

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

export type LevelState = {
  selections: Record<string, string>;
  gender: Gender | null;
};

export type WeightSheetState =
  | { kind: "level"; row: RowView }
  | { kind: "one_rm"; row: RowView; exerciseId: string };

export type Settlement = {
  opened: WeightSheetState;
  queryKeys: readonly QueryKey[];
  pulseRowIds: string[];
  receipt: string;
};

export type LevelPatchInput = {
  axes: LevelAxis[];
  coordinates: Record<string, string>;
  saved: LevelState | null;
  boundAxisIds: ReadonlySet<string>;
};

export type LevelMessages = {
  appliedMessage: string;
  failedMessage: string;
};

const SINGLE_WEIGHT_COUNT = 1;
const NO_AXES: LevelAxis[] = [];
const NO_ROW_IDS: string[] = [];
const NO_SELECTIONS: Record<string, string> = {};

export const parseOneRm = (raw: string): number | null => {
  const parsed = kgSchema.safeParse(Number(raw.trim()));

  return parsed.success ? parsed.data : null;
};

export const shortenReceiptCoordinate = (value: string): string =>
  shortenGraphemes(value, RECEIPT_COORD_MAX_CHARS);

export const levelAxesOf = (row: RowView | null): LevelAxis[] => {
  const load = row?.load ?? null;

  return load !== null && load.kind === "byProfile" ? toLevelAxes(load.axes) : NO_AXES;
};

export const boundAxisIdsOf = (rows: RowView[]): ReadonlySet<string> =>
  new Set(
    rows
      .flatMap((row) => levelAxesOf(row))
      .filter((axis) => axis.binding !== null)
      .map((axis) => axis.id),
  );

export const rowIdsSharingAxes = (rows: RowView[], axes: LevelAxis[]): string[] => {
  const wanted = new Set(axes.map((axis) => axis.id));

  if (wanted.size === 0) {
    return NO_ROW_IDS;
  }

  return rows
    .filter((row) => levelAxesOf(row).some((axis) => wanted.has(axis.id)))
    .map((row) => row.rowId);
};

export const mergeLevelState = (saved: LevelState | null, draft: LevelState): LevelState => ({
  selections: { ...(saved?.selections ?? NO_SELECTIONS), ...draft.selections },
  gender: draft.gender ?? saved?.gender ?? null,
});

const coordinateOf = (axis: LevelAxis, state: LevelState): string | null => {
  if (axis.binding === "GENDER") {
    return axis.values.find((value) => GENDER_BY_COORD[value] === state.gender) ?? null;
  }

  const picked = state.selections[axis.id];

  return picked !== undefined && axis.values.includes(picked) ? picked : null;
};

export const coordinatesOf = (axes: LevelAxis[], state: LevelState): Record<string, string> =>
  Object.fromEntries(
    axes
      .map((axis) => [axis.id, coordinateOf(axis, state)] as const)
      .filter((entry): entry is readonly [string, string] => entry[1] !== null),
  );

const withoutBoundKeys = (
  selections: Record<string, string>,
  boundAxisIds: ReadonlySet<string>,
): Record<string, string> =>
  Object.fromEntries(Object.entries(selections).filter(([axisId]) => !boundAxisIds.has(axisId)));

export const buildLevelPatch = ({
  axes,
  coordinates,
  saved,
  boundAxisIds,
}: LevelPatchInput): UpdateAthleteProfileRequest | null => {
  if (axes.length === 0 || saved === null) {
    return null;
  }

  const bound = new Set([
    ...boundAxisIds,
    ...axes.filter((axis) => axis.binding !== null).map((axis) => axis.id),
  ]);
  const selections = withoutBoundKeys(saved.selections, bound);
  let gender: Gender | undefined;
  let hasPickedAxis = false;

  for (const axis of axes) {
    const value = coordinates[axis.id];

    if (value === undefined) {
      return null;
    }

    if (axis.binding === null) {
      selections[axis.id] = value;
      hasPickedAxis = true;
      continue;
    }

    const mapped = GENDER_BY_COORD[value];

    if (mapped === undefined) {
      return null;
    }

    gender = mapped;
  }

  return {
    ...(hasPickedAxis && { profileSelections: selections }),
    ...(gender !== undefined && { gender }),
  };
};

export const buildLevelMessages = (
  axes: LevelAxis[],
  patch: UpdateAthleteProfileRequest,
  saved: LevelState,
): LevelMessages => ({
  appliedMessage: buildAppliedMessage({
    axes,
    selections: patch.profileSelections ?? saved.selections,
    gender: patch.gender ?? saved.gender,
  }),
  failedMessage: buildFailedMessage({
    axes,
    selections: saved.selections,
    gender: saved.gender,
  }),
});

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
