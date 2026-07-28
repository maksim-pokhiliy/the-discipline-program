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

export const shortenCoordinate = (value: string): string => {
  if (value.length <= PICK_VALUE_MAX_CHARS) {
    return value;
  }

  return `${value.slice(0, PICK_VALUE_MAX_CHARS).trim()}${PICK_VALUE_ELLIPSIS}`;
};

const pickableAxesOf = (axes: ProfileAxis[]): ProfileAxis[] =>
  axes.filter((axis) => axis.binding === null);

export const buildCoordinateParts = ({
  axes,
  selections,
  gender,
}: ProfileCoordinatesInput): string[] => {
  const picked = pickableAxesOf(axes)
    .map((axis) => selections[axis.id])
    .filter((value): value is string => value !== undefined);
  const genderPart = gender === null ? [] : [GENDER_LABELS[gender]];

  return [...picked, ...genderPart].map(shortenCoordinate);
};

export const buildMissingCoordinate = ({
  axes,
  selections,
  gender,
}: ProfileCoordinatesInput): string | null => {
  const unpicked = pickableAxesOf(axes).find((axis) => selections[axis.id] === undefined);

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

  if (parts.length === 0) {
    return `${PICK_APPLIED_PREFIX}${missing}${PICK_MISSING_SUFFIX}`;
  }

  return `${PICK_APPLIED_PREFIX}${parts}${PICK_SENTENCE_END} ${missing}${PICK_MISSING_SUFFIX}`;
};

export const buildFailedMessage = (coordinates: ProfileCoordinatesInput): string => {
  const parts = buildCoordinateParts(coordinates).join(PICK_COORDINATE_SEPARATOR);

  if (parts.length === 0) {
    return PICK_FAILED_NOT_PICKED;
  }

  return `${PICK_FAILED_PREFIX}${parts}${PICK_SENTENCE_END}`;
};
