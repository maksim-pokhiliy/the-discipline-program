import {
  BODY_PARTS,
  MODALITIES,
  MOVEMENT_PATTERNS,
  schemeArchetypeKindSchema,
  SKILL_LEVELS,
  type LibraryScope,
} from "@repo/contracts/lms/_domain";
import { SCHEME_PARAMS_DEFAULTS } from "@repo/ui";

const formatToken = (value: string): string =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const MOVEMENT_PATTERN_OPTIONS = MOVEMENT_PATTERNS.map((value) => ({
  value,
  label: formatToken(value),
}));

export const MODALITY_OPTIONS = MODALITIES.map((value) => ({
  value,
  label: formatToken(value),
}));

export const SKILL_LEVEL_OPTIONS = SKILL_LEVELS.map((value) => ({
  value,
  label: formatToken(value),
}));

export const BODY_PART_OPTIONS = BODY_PARTS.map((value) => ({
  value,
  label: formatToken(value),
}));

export const SCHEME_ARCHETYPE_KIND_OPTIONS = schemeArchetypeKindSchema.options.map((value) => ({
  value,
  label: formatToken(value),
}));

export const SCOPE_CHIP_COLOR: Record<LibraryScope, "primary" | "default"> = {
  SYSTEM: "primary",
  COACH: "default",
};

export const SCOPE_FILTER_VALUES = ["ALL", "SYSTEM", "OWN"] as const;
export type ScopeFilterValue = (typeof SCOPE_FILTER_VALUES)[number];

export const SCOPE_FILTER_LABELS: Record<ScopeFilterValue, string> = {
  ALL: "All",
  SYSTEM: "System",
  OWN: "Mine",
};

export const DEFAULT_PARAMS_TEMPLATES = SCHEME_PARAMS_DEFAULTS;

export { formatToken };
