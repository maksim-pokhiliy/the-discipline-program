export const SCHEMA_ROW_CONSTANTS = {
  MAX_NOTES_LENGTH: 2000,
} as const;

export const ROW_KINDS = [
  "EXERCISE",
  "REST",
  "FOOTNOTE",
  "STANDALONE_LOAD",
  "STANDALONE_URL",
  "PLACEHOLDER",
  "INNER_LADDER_MARKER",
  "REP_DEFINITION",
  "REST_SLOT",
] as const;
export type RowKind = (typeof ROW_KINDS)[number];

export const POSITIONS = [
  "NEUTRAL_GRIP",
  "FROM_SOFA",
  "FROM_BOX",
  "FROM_BOX_OR_SOFA",
  "FROM_SOFA_BOX",
  "WITHOUT_BENCH",
  "WITHOUT_JUMP",
  "HOLD_FARM_CARRY",
  "HAND_ON_DB",
  "HANDS_ON_DB",
  "HAND_ON_DB_NEUTRAL_GRIP",
] as const;
export type Position = (typeof POSITIONS)[number];

export const URL_APPLIES_TO = ["previous_exercise_row", "whole_schema"] as const;
export type UrlAppliesTo = (typeof URL_APPLIES_TO)[number];

export const FOOTNOTE_MARKERS = ["*", "**"] as const;
export type FootnoteMarker = (typeof FOOTNOTE_MARKERS)[number];
