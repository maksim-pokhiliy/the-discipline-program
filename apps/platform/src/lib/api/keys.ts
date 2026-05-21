import type { AppLevelValue } from "@repo/contracts/lms/label";
import { createEntityKeys } from "@repo/query";

const ROOT = ["platform"] as const;

export const platformKeys = {
  root: ROOT,

  trainingPlans: createEntityKeys(ROOT, "training-plans"),
  users: {
    search: (query: string) => [...ROOT, "users", "search", query] as const,
  },
  athletes: createEntityKeys(ROOT, "athletes"),
  coachDashboard: {
    data: () => [...ROOT, "coach-dashboard"] as const,
  },
  coachActionItems: {
    all: () => [...ROOT, "coach-action-items"] as const,
  },
  weeks: {
    byDate: (planId: string, startDate: string) =>
      [...ROOT, "training-plans", planId, "weeks", startDate] as const,
  },
  labels: {
    search: (level?: AppLevelValue, q?: string) =>
      [...ROOT, "labels", "search", level ?? null, q ?? null] as const,
  },
  archetypes: {
    all: () => [...ROOT, "archetypes"] as const,
  },
} as const;
