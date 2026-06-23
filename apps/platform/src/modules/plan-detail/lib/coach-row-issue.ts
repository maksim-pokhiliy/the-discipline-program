import type { ZodIssue } from "zod";

import { formatZodIssue } from "./format-zod-issue";

const RANGE_MAX_OVER_VALUE = "percentage.rangeMax must be > value when set";
const REPS_RANGE_ORDER = "range.min must be < range.max";
const UNIT_BOUND_NEEDS_ONE = "unit_bound needs value or range";
const UNIT_BOUND_NOT_BOTH = "unit_bound cannot have both value and range";
const PROFILE_CARTESIAN_COVER_PREFIX = "byProfile.cells must cover every combination";
const PROFILE_COORD_ARITY_PREFIX = "byProfile cell coords must have one value per axis";
const PROFILE_COORD_NOT_IN_AXIS_PREFIX = "byProfile coord";
const PROFILE_COORDS_NOT_UNIQUE = "byProfile cells must have unique coords";
const PROFILE_AXIS_DUPLICATE_SUFFIX = "has duplicate values; each value must be unique";
const PROFILE_AXES_DISTINCT = "byProfile axes must be distinct dimensions";

const COACH_MESSAGES = {
  setsPositive: "Enter a number of sets greater than 0.",
  weightPositive: "Enter a weight greater than 0.",
  profileAxisPick: "Pick an axis for this dimension (or create one).",
  profileAxisDistinct: "Each axis must be a different dimension.",
  profileAxisDuplicate: "Give each axis value a unique name; two are the same.",
  profileCellWeight: "Enter a weight greater than 0 for each combination.",
  profileCartesianCover: "Fill in a weight for every combination of axis values.",
  profileCoords: "Pick axis values that match the axes you defined.",
  percentRange: "Enter a % between 0 and 200.",
  percentMaxRange: "Enter a max % between 0 and 200.",
  percentMaxOverValue: "Max % must be higher than the %.",
  referencePick: "Pick the reference exercise.",
  repsPositive: "Enter a number of reps greater than 0.",
  repsRangeOrder: "The min reps must be lower than the max.",
  durationNeeded: "Enter a time or distance value.",
  durationNotBoth: "Choose either a single value or a range, not both.",
  perLimbPositive: "Enter a per-limb count greater than 0.",
  modifiersTooMany: "Pick fewer modifiers.",
  modifiersDuplicate: "Remove the duplicate modifier.",
  tempoTooLong: "Shorten the tempo to a 4-digit code like 3-1-X-0 or a brief note.",
} as const;

const stringAt = (path: ZodIssue["path"], index: number): string | undefined => {
  const segment = path[index];

  return typeof segment === "string" ? segment : undefined;
};

const coachMessageForProfileCells = (
  path: ZodIssue["path"],
  issue: ZodIssue,
): string | undefined => {
  if (issue.message.startsWith(PROFILE_CARTESIAN_COVER_PREFIX)) {
    return COACH_MESSAGES.profileCartesianCover;
  }

  if (
    issue.message.startsWith(PROFILE_COORD_ARITY_PREFIX) ||
    issue.message.startsWith(PROFILE_COORD_NOT_IN_AXIS_PREFIX) ||
    issue.message === PROFILE_COORDS_NOT_UNIQUE ||
    stringAt(path, 3) === "coords"
  ) {
    return COACH_MESSAGES.profileCoords;
  }

  if (stringAt(path, 3) === "kg") {
    return COACH_MESSAGES.profileCellWeight;
  }

  return undefined;
};

const coachMessageForLoad = (path: ZodIssue["path"], issue: ZodIssue): string | undefined => {
  const field = stringAt(path, 1);

  if (field === "axes") {
    if (issue.message === PROFILE_AXES_DISTINCT) {
      return COACH_MESSAGES.profileAxisDistinct;
    }

    if (issue.message.endsWith(PROFILE_AXIS_DUPLICATE_SUFFIX)) {
      return COACH_MESSAGES.profileAxisDuplicate;
    }

    return COACH_MESSAGES.profileAxisPick;
  }

  if (field === "cells") {
    return coachMessageForProfileCells(path, issue);
  }

  if (field === "kg") {
    return COACH_MESSAGES.weightPositive;
  }

  if (field === "value") {
    return COACH_MESSAGES.percentRange;
  }

  if (field === "rangeMax") {
    return COACH_MESSAGES.percentMaxRange;
  }

  if (field === "reference" && stringAt(path, 2) === "targetExerciseId") {
    return COACH_MESSAGES.referencePick;
  }

  return issue.message === RANGE_MAX_OVER_VALUE ? COACH_MESSAGES.percentMaxOverValue : undefined;
};

const coachMessageForReps = (path: ZodIssue["path"], issue: ZodIssue): string | undefined => {
  const field = stringAt(path, 1);

  if (field === "value" || field === "min" || field === "max") {
    return COACH_MESSAGES.repsPositive;
  }

  if (issue.message === REPS_RANGE_ORDER) {
    return COACH_MESSAGES.repsRangeOrder;
  }

  if (issue.message === UNIT_BOUND_NEEDS_ONE) {
    return COACH_MESSAGES.durationNeeded;
  }

  if (issue.message === UNIT_BOUND_NOT_BOTH) {
    return COACH_MESSAGES.durationNotBoth;
  }

  return undefined;
};

const coachMessageForRoot = (root: string | undefined, issue: ZodIssue): string | undefined => {
  const { path } = issue;

  if (root === "sets") {
    return COACH_MESSAGES.setsPositive;
  }

  if (root === "load") {
    return coachMessageForLoad(path, issue);
  }

  if (root === "reps") {
    return coachMessageForReps(path, issue);
  }

  if (root === "side" && stringAt(path, 1) === "countPerLimb") {
    return COACH_MESSAGES.perLimbPositive;
  }

  if (root === "tempo") {
    return COACH_MESSAGES.tempoTooLong;
  }

  if (root === "modifierIds") {
    return issue.message.includes("unique")
      ? COACH_MESSAGES.modifiersDuplicate
      : COACH_MESSAGES.modifiersTooMany;
  }

  return undefined;
};

export const coachRowIssue = (issue: ZodIssue): string =>
  coachMessageForRoot(stringAt(issue.path, 0), issue) ?? formatZodIssue(issue);
