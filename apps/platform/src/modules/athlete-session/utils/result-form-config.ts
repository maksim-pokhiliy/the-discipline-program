import { DISTANCE_UNITS, type Result, type ResultType } from "@repo/contracts/lms/_shared";

import {
  CALORIES_FIELD_LABEL,
  DISTANCE_FIELD_LABEL,
  LOAD_FIELD_LABEL,
  MAX_REPS_FIELD_LABEL,
  REPS_FIELD_LABEL,
  ROUNDS_FIELD_LABEL,
  SECONDS_PER_MINUTE,
  TIME_MINUTES_LABEL,
  TIME_SECONDS_LABEL,
} from "./athlete-session.constants";

export type ResultDraft = Record<string, string>;

export type ResultFieldsProps = {
  draft: ResultDraft;
  onChange: (key: string, value: string) => void;
};

export type ResultFieldDef = {
  key: string;
  label: string;
};

export const TIME_MINUTES_KEY = "minutes";
export const TIME_SECONDS_KEY = "seconds";
export const ROUNDS_KEY = "rounds";
export const REPS_KEY = "reps";
export const LOAD_KEY = "kg";
export const MAX_REPS_KEY = "reps";
export const DISTANCE_VALUE_KEY = "value";
export const DISTANCE_UNIT_KEY = "unit";
export const CALORIES_KEY = "value";

const DEFAULT_DISTANCE_UNIT = DISTANCE_UNITS[0];

const parseNumber = (raw: string | undefined): number | null => {
  if (raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) ? parsed : null;
};

const isPositive = (value: number | null): value is number => value !== null && value > 0;
const isNonNegativeInt = (value: number | null): value is number =>
  value !== null && Number.isInteger(value) && value >= 0;
const isPositiveInt = (value: number | null): value is number =>
  value !== null && Number.isInteger(value) && value > 0;

const isDistanceUnit = (raw: string | undefined): raw is (typeof DISTANCE_UNITS)[number] =>
  raw !== undefined && DISTANCE_UNITS.some((unit) => unit === raw);

const buildTime = (draft: ResultDraft): Result | null => {
  const minutes = parseNumber(draft[TIME_MINUTES_KEY]) ?? 0;
  const seconds = parseNumber(draft[TIME_SECONDS_KEY]) ?? 0;

  if (!Number.isInteger(minutes) || !Number.isInteger(seconds) || seconds < 0) {
    return null;
  }

  const total = minutes * SECONDS_PER_MINUTE + seconds;

  return total > 0 ? { type: "time", seconds: total } : null;
};

const buildRoundsReps = (draft: ResultDraft): Result | null => {
  const rounds = parseNumber(draft[ROUNDS_KEY]);
  const reps = parseNumber(draft[REPS_KEY]);

  if (!isNonNegativeInt(rounds) || !isNonNegativeInt(reps)) {
    return null;
  }

  return rounds + reps > 0 ? { type: "rounds_reps", rounds, reps } : null;
};

const buildLoad = (draft: ResultDraft): Result | null => {
  const kg = parseNumber(draft[LOAD_KEY]);

  return isPositive(kg) ? { type: "load", kg } : null;
};

const buildMaxReps = (draft: ResultDraft): Result | null => {
  const reps = parseNumber(draft[MAX_REPS_KEY]);

  return isPositiveInt(reps) ? { type: "max_reps", reps } : null;
};

const buildDistance = (draft: ResultDraft): Result | null => {
  const value = parseNumber(draft[DISTANCE_VALUE_KEY]);
  const rawUnit = draft[DISTANCE_UNIT_KEY];
  const unit = isDistanceUnit(rawUnit) ? rawUnit : DEFAULT_DISTANCE_UNIT;

  return isPositive(value) ? { type: "distance", value, unit } : null;
};

const buildCalories = (draft: ResultDraft): Result | null => {
  const value = parseNumber(draft[CALORIES_KEY]);

  return isPositiveInt(value) ? { type: "calories", value } : null;
};

export type ResultFormConfig = {
  fields: ResultFieldDef[];
  buildResult: (draft: ResultDraft) => Result | null;
  validate: (draft: ResultDraft) => boolean;
};

const withValidate = (config: Omit<ResultFormConfig, "validate">): ResultFormConfig => ({
  ...config,
  validate: (draft) => config.buildResult(draft) !== null,
});

export const RESULT_FORM_CONFIG: Record<ResultType, ResultFormConfig> = {
  time: withValidate({
    fields: [
      { key: TIME_MINUTES_KEY, label: TIME_MINUTES_LABEL },
      { key: TIME_SECONDS_KEY, label: TIME_SECONDS_LABEL },
    ],
    buildResult: buildTime,
  }),
  rounds_reps: withValidate({
    fields: [
      { key: ROUNDS_KEY, label: ROUNDS_FIELD_LABEL },
      { key: REPS_KEY, label: REPS_FIELD_LABEL },
    ],
    buildResult: buildRoundsReps,
  }),
  load: withValidate({
    fields: [{ key: LOAD_KEY, label: LOAD_FIELD_LABEL }],
    buildResult: buildLoad,
  }),
  max_reps: withValidate({
    fields: [{ key: MAX_REPS_KEY, label: MAX_REPS_FIELD_LABEL }],
    buildResult: buildMaxReps,
  }),
  distance: withValidate({
    fields: [{ key: DISTANCE_VALUE_KEY, label: DISTANCE_FIELD_LABEL }],
    buildResult: buildDistance,
  }),
  calories: withValidate({
    fields: [{ key: CALORIES_KEY, label: CALORIES_FIELD_LABEL }],
    buildResult: buildCalories,
  }),
};

export const buildResult = (resultType: ResultType, draft: ResultDraft): Result | null =>
  RESULT_FORM_CONFIG[resultType].buildResult(draft);

export const isResultDraftValid = (resultType: ResultType, draft: ResultDraft): boolean =>
  RESULT_FORM_CONFIG[resultType].validate(draft);
