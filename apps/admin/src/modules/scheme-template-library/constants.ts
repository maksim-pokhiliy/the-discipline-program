import {
  LIBRARY_SCOPES,
  schemeArchetypeKindSchema,
  type LibraryScope,
} from "@repo/contracts/lms/_domain";

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

export const DEFAULT_PARAMS_TEMPLATES: Record<string, unknown> = {
  NONE: { kind: "NONE" },
  COUNT_UP: { kind: "COUNT_UP" },
  COUNT_DOWN: { kind: "COUNT_DOWN", durationSec: 600 },
  INTERVAL_LOOP: {
    kind: "INTERVAL_LOOP",
    sets: 5,
    slots: [
      { durationSec: 30, action: "WORK" },
      { durationSec: 30, action: "REST" },
    ],
  },
  EMOM_LOOP: {
    kind: "EMOM_LOOP",
    totalMinutes: 10,
    slots: [{ minutes: [0], action: { kind: "ENTRY", entryRefIndex: 0 } }],
  },
  TIME_BOXED: {
    kind: "TIME_BOXED",
    segments: [
      {
        startSec: 0,
        endSec: 600,
        innerArchetypeKind: "NONE",
        innerParams: { kind: "NONE" },
      },
    ],
  },
};

export { formatToken };
