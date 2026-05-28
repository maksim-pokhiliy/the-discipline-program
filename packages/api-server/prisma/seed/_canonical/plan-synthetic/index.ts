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
  notes: "Demo synthetic plan covering training-domain matrix sections 1-26",
};

const DEMO_PLAN_SHELL: CanonicalSeed["plan"] = {
  title: "Demo CFG Quarter — Synthetic Coverage Plan",
  description:
    "Demo plan authored synthetically for Coach Denys's plan editor coverage matrix. Two active weeks framed by a travel gap, followed by a Phase 7 tail covering HR-zone work, numeric pace intervals, tempo, wave, cluster, and super-set examples.",
  athleteName: "Demo Athlete",
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
