import {
  BODY_PARTS,
  LIBRARY_SCOPES,
  MODALITIES,
  MOVEMENT_PATTERNS,
  SKILL_LEVELS,
  type LibraryScope,
} from "@repo/contracts/lms/_domain";

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

export const LIBRARY_SCOPE_OPTIONS = LIBRARY_SCOPES.map((value) => ({
  value,
  label: value === "SYSTEM" ? "System" : "Coach",
}));

export const SCOPE_CHIP_COLOR: Record<LibraryScope, "primary" | "default"> = {
  SYSTEM: "primary",
  COACH: "default",
};

export { formatToken };
