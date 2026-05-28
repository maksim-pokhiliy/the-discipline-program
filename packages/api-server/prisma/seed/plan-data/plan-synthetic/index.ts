import type { CanonicalSeed } from "../canonical-schema";

import { DEMO_EXERCISES } from "./catalog-exercises";
import { DEMO_LABELS } from "./catalog-labels";
import { PHASE_7_EXAMPLES } from "./phase-7";
import { WEEK_1 } from "./week-1";
import { WEEK_2 } from "./week-2";
import { WEEK_TRAVEL_GAP } from "./week-travel-gap";

export { DEMO_EXERCISES, DEMO_LABELS };

const DEMO_PLAN_META: CanonicalSeed["meta"] = {
  schemaVersion: 1,
  generatedAt: new Date(0).toISOString(),
  sourceRepoCommit: null,
  sourceSheetsRange: { fromSheet: "sheet-01", toSheet: "sheet-01" },
  notes: "Synthetic plan covering training-domain matrix sections 1-26",
};

const DEMO_PLAN_SHELL: CanonicalSeed["plan"] = {
  title: "CFG Quarter Build",
  description:
    "Quarter build block: two loaded weeks around a travel deload, capped by a mixed-modal tail — HR-zone base runs, numeric-pace erg intervals, tempo back squat, snatch wave loading, strict pull-up clusters, and accessory super-sets.",
  athleteName: "Andrii Koval",
  totalWeeks: 4,
  todayWeekIndex: 1,
};

export const SYNTHETIC_DEMO_PLAN: CanonicalSeed = {
  meta: DEMO_PLAN_META,
  catalog: { exercises: DEMO_EXERCISES, labels: DEMO_LABELS },
  plan: DEMO_PLAN_SHELL,
  weeks: [WEEK_1, WEEK_TRAVEL_GAP, WEEK_2],
  phase7Examples: PHASE_7_EXAMPLES,
};
