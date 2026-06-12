import type { TimeCap } from "@repo/contracts/lms/_shared";

import type { RepetitionAxis } from "./axis-draft.types";

export const DEFAULT_TIME_CAP: TimeCap = { min: 12, unit: "min" };

export const REPETITION_DEFAULTS: Record<RepetitionAxis["kind"], RepetitionAxis> = {
  once: { kind: "once" },
  count: { kind: "count", count: 3 },
  ladder: { kind: "ladder", steps: [21, 15, 9] },
  timeCap: { kind: "timeCap", cap: DEFAULT_TIME_CAP },
  cadence: { kind: "cadence", everyMin: 1, rounds: 4 },
  interval: { kind: "interval", workMin: 2, offMin: 1, count: 3 },
};
