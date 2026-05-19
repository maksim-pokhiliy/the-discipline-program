export const SCHEMA_CONSTANTS = {
  MAX_HEADER_LENGTH: 500,
  MAX_NOTES_LENGTH: 2000,
} as const;

export const SCHEMA_KINDS = ["ATOMIC", "HEADERLESS", "NESTED", "NAMED", "COMPOSITE"] as const;
export type SchemaKind = (typeof SCHEMA_KINDS)[number];

export const SUB_SCHEMA_ALLOWED_KINDS = ["ATOMIC", "HEADERLESS"] as const;
export type SubSchemaAllowedKind = (typeof SUB_SCHEMA_ALLOWED_KINDS)[number];

export const ARCHETYPE_FAMILIES = [
  "ROUNDS_SETS",
  "LADDER",
  "TIME_CAP",
  "COMPOSITE_ROUNDS",
  "NESTED",
  "NAMED",
  "SINGLE_LINE_HEADERLESS",
  "FLAT_PARALLEL_HEADERLESS",
  "MODALITY_REFERENCE",
] as const;
export type ArchetypeFamily = (typeof ARCHETYPE_FAMILIES)[number];

export const ARCHETYPE_NAMES = [
  "n-rounds",
  "alternating-sets",
  "ladder-descending",
  "ladder-ascending",
  "ladder-vertex-down-pyramid",
  "ladder-spike",
  "parallel-ladders-descending",
  "parallel-ladders-mixed-direction",
  "parallel-pyramids",
  "amrap-flat",
  "emom-nested-per-minute",
  "emom-sub-minute-slot",
  "time-window-outer",
  "composite-rounds-with-rest",
  "composite-intervals-then-rounds",
  "composite-intervals-work-rest-fixed",
  "composite-intervals-work-rest-progressive",
  "composite-intervals-on-off-max-tail",
  "composite-rolling-rounds",
  "nested-rounds-over-rounds",
  "nested-rounds-over-parallel-ladder",
  "nested-composite-rounds-over-ladder",
  "named-themed-sets",
  "named-exercise-program",
  "single-line-with-then-connector",
  "single-line-bare",
  "single-line-total-counter",
  "flat-list-headerless",
  "pull-ups-dips-cycle",
  "run-distance",
  "placeholder-body",
  "practice-list",
  "url-only-body",
  "super-set",
] as const;
export type ArchetypeName = (typeof ARCHETYPE_NAMES)[number];
