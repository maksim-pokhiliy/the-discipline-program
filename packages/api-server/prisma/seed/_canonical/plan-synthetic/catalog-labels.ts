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
    ref: "demo-rest-day",
    name: "Demo REST DAY",
    applicableLevels: ["DAY"],
    rest: true,
  }),
  buildLabel({ ref: "demo-main", name: "Demo MAIN", applicableLevels: ["DAY", "SESSION"] }),
  buildLabel({ ref: "demo-1st-session", name: "Demo 1ST SESSION", applicableLevels: ["SESSION"] }),
  buildLabel({ ref: "demo-2nd-session", name: "Demo 2ND SESSION", applicableLevels: ["SESSION"] }),
  buildLabel({ ref: "demo-strength", name: "Demo STRENGTH", applicableLevels: ["BLOCK"] }),
  buildLabel({ ref: "demo-metcon", name: "Demo METCON", applicableLevels: ["BLOCK"] }),
  buildLabel({ ref: "demo-conditioning", name: "Demo CONDITIONING", applicableLevels: ["BLOCK"] }),
  buildLabel({ ref: "demo-endurance", name: "Demo ENDURANCE", applicableLevels: ["BLOCK"] }),
  buildLabel({ ref: "demo-pump", name: "Demo PUMP SESSION", applicableLevels: ["BLOCK"] }),
  buildLabel({ ref: "demo-gymnastics", name: "Demo Gymnastics", applicableLevels: ["BLOCK"] }),
  buildLabel({ ref: "demo-skill", name: "Demo SKILL", applicableLevels: ["BLOCK"] }),
  buildLabel({ ref: "demo-olympic", name: "Demo OLYMPIC", applicableLevels: ["BLOCK"] }),
  buildLabel({ ref: "demo-accessory", name: "Demo ACCESSORY", applicableLevels: ["BLOCK"] }),
  buildLabel({ ref: "demo-partner", name: "Demo PARTNER", applicableLevels: ["BLOCK"] }),
  buildLabel({
    ref: "demo-strength-endurance",
    name: "Demo STRENGTH ENDURANCE",
    applicableLevels: ["BLOCK"],
  }),
  buildLabel({ ref: "demo-easy-pace", name: "Demo EASY PACE", applicableLevels: ["BLOCK"] }),
  buildLabel({
    ref: "demo-warm-up-feet",
    name: "Demo warm up for feet",
    applicableLevels: ["BLOCK"],
  }),
  buildLabel({
    ref: "demo-warm-up-run",
    name: "Demo warm up BEFORE run",
    applicableLevels: ["BLOCK"],
  }),
  buildLabel({ ref: "demo-core", name: "Demo CORE", applicableLevels: ["BLOCK"] }),
  buildLabel({ ref: "demo-practice", name: "Demo PRACTICE", applicableLevels: ["BLOCK"] }),
  buildLabel({ ref: "demo-cool-down", name: "Demo COOL DOWN", applicableLevels: ["BLOCK"] }),
  buildLabel({ ref: "demo-mobility", name: "Demo MOBILITY", applicableLevels: ["BLOCK"] }),
];
