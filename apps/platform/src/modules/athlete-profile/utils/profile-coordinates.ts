import { type Gender, GENDER_LABELS } from "@repo/contracts/coaching/athlete-profile";
import { type ProfileAxis } from "@repo/contracts/coaching/profile-axis";

import {
  GENDER_FIELD_LABEL,
  PICK_APPLIED_PREFIX,
  PICK_APPLIED_RESOLVE_PREFIX,
  PICK_COORDINATE_SEPARATOR,
  PICK_FAILED_NOT_PICKED,
  PICK_FAILED_PREFIX,
  PICK_MISSING_SUFFIX,
  PICK_SENTENCE_END,
  PICK_VALUE_ELLIPSIS,
  PICK_VALUE_MAX_CHARS,
} from "./athlete-profile.constants";

export type ProfileCoordinatesInput = {
  axes: ProfileAxis[];
  selections: Record<string, string>;
  gender: Gender | null;
};

const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

export const shortenCoordinate = (value: string): string => {
  const graphemes = [...graphemeSegmenter.segment(value)].map((segment) => segment.segment);

  if (graphemes.length <= PICK_VALUE_MAX_CHARS) {
    return value;
  }

  return `${graphemes.slice(0, PICK_VALUE_MAX_CHARS).join("").trim()}${PICK_VALUE_ELLIPSIS}`;
};

const pickableAxesOf = (axes: ProfileAxis[]): ProfileAxis[] =>
  axes.filter((axis) => axis.binding === null);

export const resolvePickedValue = (
  axis: ProfileAxis,
  selections: Record<string, string>,
): string | null => {
  const value = selections[axis.id];

  if (value === undefined || !axis.values.includes(value)) {
    return null;
  }

  return value;
};

const buildAxisParts = ({ axes, selections }: ProfileCoordinatesInput): string[] =>
  pickableAxesOf(axes)
    .map((axis) => resolvePickedValue(axis, selections))
    .filter((value): value is string => value !== null)
    .map(shortenCoordinate);

export const buildCoordinateParts = (coordinates: ProfileCoordinatesInput): string[] => {
  const { gender } = coordinates;
  const genderParts = gender === null ? [] : [shortenCoordinate(GENDER_LABELS[gender])];

  return [...buildAxisParts(coordinates), ...genderParts];
};

export const buildMissingCoordinate = ({
  axes,
  selections,
  gender,
}: ProfileCoordinatesInput): string | null => {
  const unpicked = pickableAxesOf(axes).find(
    (axis) => resolvePickedValue(axis, selections) === null,
  );

  if (unpicked !== undefined) {
    return unpicked.label;
  }

  return gender === null ? GENDER_FIELD_LABEL : null;
};

export const buildAppliedMessage = (coordinates: ProfileCoordinatesInput): string => {
  const parts = buildCoordinateParts(coordinates).join(PICK_COORDINATE_SEPARATOR);
  const missing = buildMissingCoordinate(coordinates);

  if (missing === null) {
    return `${PICK_APPLIED_PREFIX}${PICK_APPLIED_RESOLVE_PREFIX}${parts}${PICK_SENTENCE_END}`;
  }

  if (buildAxisParts(coordinates).length === 0) {
    return `${PICK_APPLIED_PREFIX}${missing}${PICK_MISSING_SUFFIX}`;
  }

  return `${PICK_APPLIED_PREFIX}${parts}${PICK_SENTENCE_END} ${missing}${PICK_MISSING_SUFFIX}`;
};

export const buildFailedMessage = (coordinates: ProfileCoordinatesInput): string => {
  if (buildAxisParts(coordinates).length === 0) {
    return PICK_FAILED_NOT_PICKED;
  }

  const parts = buildCoordinateParts(coordinates).join(PICK_COORDINATE_SEPARATOR);
  const missing = buildMissingCoordinate(coordinates);
  const failed = `${PICK_FAILED_PREFIX}${parts}${PICK_SENTENCE_END}`;

  if (missing === null) {
    return failed;
  }

  return `${failed} ${missing}${PICK_MISSING_SUFFIX}`;
};
