import type { CanonicalSeed } from "./canonical-schema";

export const SYNTHETIC_DEMO_PLAN: CanonicalSeed = {
  meta: {
    schemaVersion: 1,
    generatedAt: "1970-01-01T00:00:00.000Z",
    sourceRepoCommit: null,
    sourceSheetsRange: {
      fromSheet: "sheet-01",
      toSheet: "sheet-01",
    },
    notes: null,
  },
  catalog: {
    exercises: [],
    labels: [],
  },
  plan: {
    title: "Demo Plan (stub — phase a forward-ref placeholder)",
    description: null,
    athleteName: "Demo Athlete",
    totalWeeks: 1,
    todayWeekIndex: 1,
  },
  weeks: [],
  phase7Examples: [],
};
