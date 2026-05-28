import type { LabelCatalogEntry } from "../canonical-schema";

type LabelSeed = Omit<LabelCatalogEntry, "rest" | "notes"> & {
  rest?: boolean;
  notes?: string | null;
};

const buildLabel = (seed: LabelSeed): LabelCatalogEntry => ({
  ref: seed.ref,
  name: seed.name,
  applicableLevels: seed.applicableLevels,
  rest: seed.rest ?? false,
  notes: seed.notes ?? null,
});

export const DEMO_LABELS: LabelCatalogEntry[] = [
  buildLabel({
    ref: "rest-day",
    name: "REST DAY",
    applicableLevels: ["DAY"],
    rest: true,
  }),
  buildLabel({ ref: "main", name: "MAIN", applicableLevels: ["DAY", "SESSION"] }),
  buildLabel({ ref: "1st-session", name: "1ST SESSION", applicableLevels: ["SESSION"] }),
  buildLabel({ ref: "2nd-session", name: "2ND SESSION", applicableLevels: ["SESSION"] }),
  buildLabel({ ref: "strength", name: "STRENGTH", applicableLevels: ["BLOCK"] }),
  buildLabel({ ref: "metcon", name: "METCON", applicableLevels: ["BLOCK"] }),
  buildLabel({ ref: "conditioning", name: "CONDITIONING", applicableLevels: ["BLOCK"] }),
  buildLabel({ ref: "endurance", name: "ENDURANCE", applicableLevels: ["BLOCK"] }),
  buildLabel({ ref: "pump", name: "PUMP SESSION", applicableLevels: ["BLOCK"] }),
  buildLabel({ ref: "gymnastics", name: "Gymnastics", applicableLevels: ["BLOCK"] }),
  buildLabel({ ref: "skill", name: "SKILL", applicableLevels: ["BLOCK"] }),
  buildLabel({ ref: "olympic", name: "OLYMPIC", applicableLevels: ["BLOCK"] }),
  buildLabel({ ref: "accessory", name: "ACCESSORY", applicableLevels: ["BLOCK"] }),
  buildLabel({ ref: "partner", name: "PARTNER", applicableLevels: ["BLOCK"] }),
  buildLabel({
    ref: "strength-endurance",
    name: "STRENGTH ENDURANCE",
    applicableLevels: ["BLOCK"],
  }),
  buildLabel({ ref: "easy-pace", name: "EASY PACE", applicableLevels: ["BLOCK"] }),
  buildLabel({
    ref: "warm-up-feet",
    name: "warm up for feet",
    applicableLevels: ["BLOCK"],
  }),
  buildLabel({
    ref: "warm-up-run",
    name: "warm up BEFORE run",
    applicableLevels: ["BLOCK"],
  }),
  buildLabel({ ref: "core", name: "CORE", applicableLevels: ["BLOCK"] }),
  buildLabel({ ref: "practice", name: "PRACTICE", applicableLevels: ["BLOCK"] }),
  buildLabel({ ref: "cool-down", name: "COOL DOWN", applicableLevels: ["BLOCK"] }),
  buildLabel({ ref: "mobility", name: "MOBILITY", applicableLevels: ["BLOCK"] }),
];
