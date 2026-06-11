export const SCHEMA_ROW_CONSTANTS = {
  MAX_NOTES_LENGTH: 2000,
} as const;

export const ROW_KINDS = ["EXERCISE", "REST", "PLACEHOLDER", "REST_SLOT"] as const;
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
