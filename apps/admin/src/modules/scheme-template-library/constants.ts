import {
  LIBRARY_SCOPES,
  schemeArchetypeKindSchema,
  type LibraryScope,
} from "@repo/contracts/lms/_domain";
import { SCHEME_PARAMS_DEFAULTS } from "@repo/ui";

const formatToken = (value: string): string =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const SCHEME_ARCHETYPE_KIND_OPTIONS = schemeArchetypeKindSchema.options.map((value) => ({
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

export const DEFAULT_PARAMS_TEMPLATES = SCHEME_PARAMS_DEFAULTS;

export { formatToken };
