import type { ZodIssue } from "zod";

import { formatZodIssue } from "./format-zod-issue";

const RANGE_MAX_OVER_VALUE = "percentage.rangeMax must be > value when set";
const REPS_RANGE_ORDER = "range.min must be < range.max";
const UNIT_BOUND_NEEDS_ONE = "unit_bound needs value or range";
const UNIT_BOUND_NOT_BOTH = "unit_bound cannot have both value and range";

const COACH_MESSAGES = {
  setsPositive: "Enter a number of sets greater than 0.",
  weightPositive: "Enter a weight greater than 0.",
  profileLabel: "Add a label for each profile weight.",
  profileWeight: "Enter a weight greater than 0 for each profile weight.",
  percentRange: "Enter a % between 0 and 200.",
  percentMaxRange: "Enter a max % between 0 and 200.",
  percentMaxOverValue: "Max % must be higher than the %.",
  referencePick: "Pick the reference exercise.",
  repsPositive: "Enter a number of reps greater than 0.",
  repsRangeOrder: "The min reps must be lower than the max.",
  durationNeeded: "Enter a time or distance value.",
  durationNotBoth: "Choose either a single value or a range, not both.",
  perLimbPositive: "Enter a per-limb count greater than 0.",
  mediaUrl: "Enter a valid demo URL.",
  mediaLabel: "Add a demo label or leave it blank.",
  modifiersTooMany: "Pick fewer modifiers.",
  modifiersDuplicate: "Remove the duplicate modifier.",
} as const;

const stringAt = (path: ZodIssue["path"], index: number): string | undefined => {
  const segment = path[index];

  return typeof segment === "string" ? segment : undefined;
};

const coachMessageForLoad = (path: ZodIssue["path"], issue: ZodIssue): string | undefined => {
  const field = stringAt(path, 1);

  if (field === "kg") {
    return COACH_MESSAGES.weightPositive;
  }

  if (field === "value") {
    return COACH_MESSAGES.percentRange;
  }

  if (field === "rangeMax") {
    return COACH_MESSAGES.percentMaxRange;
  }

  if (field === "entries") {
    const entryField = stringAt(path, 3);

    if (entryField === "label") {
      return COACH_MESSAGES.profileLabel;
    }

    if (entryField === "kg") {
      return COACH_MESSAGES.profileWeight;
    }
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

const coachMessageForMedia = (path: ZodIssue["path"]): string | undefined => {
  const field = stringAt(path, 1);

  if (field === "url") {
    return COACH_MESSAGES.mediaUrl;
  }

  return field === "label" ? COACH_MESSAGES.mediaLabel : undefined;
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

  if (root === "media") {
    return coachMessageForMedia(path);
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
