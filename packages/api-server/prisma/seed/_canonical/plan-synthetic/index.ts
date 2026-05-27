import type { CanonicalSeed } from "../canonical-schema";

import { DEMO_EXERCISES } from "./catalog-exercises";
import { DEMO_LABELS } from "./catalog-labels";

export { DEMO_EXERCISES, DEMO_LABELS };

const STUB_META: CanonicalSeed["meta"] = {
  schemaVersion: 1,
  generatedAt: "1970-01-01T00:00:00.000Z",
  sourceRepoCommit: null,
  sourceSheetsRange: { fromSheet: "sheet-01", toSheet: "sheet-01" },
  notes: null,
};

const STUB_PLAN: CanonicalSeed["plan"] = {
  title: "Demo Plan (stub — phase c task 6 catalog only)",
  description: null,
  athleteName: "Demo Athlete",
  totalWeeks: 1,
  todayWeekIndex: 1,
};

export const SYNTHETIC_DEMO_PLAN: CanonicalSeed = {
  meta: STUB_META,
  catalog: { exercises: DEMO_EXERCISES, labels: DEMO_LABELS },
  plan: STUB_PLAN,
  weeks: [],
  phase7Examples: [],
};
