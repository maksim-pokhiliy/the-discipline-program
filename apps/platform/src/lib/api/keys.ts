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
  coachProfile: {
    data: () => [...ROOT, "coach-profile"] as const,
  },
  coachActionItems: {
    all: () => [...ROOT, "coach-action-items"] as const,
  },
  weeks: {
    byDate: (planId: string, startDate: string) =>
      [...ROOT, "training-plans", planId, "weeks", startDate] as const,
    populated: (planId: string) =>
      [...ROOT, "training-plans", planId, "weeks", "populated"] as const,
  },
  labels: {
    search: (level?: AppLevelValue, q?: string) =>
      [...ROOT, "labels", "search", level ?? null, q ?? null] as const,
  },
  exercises: {
    all: () => [...ROOT, "exercises"] as const,
  },
  modifiers: {
    search: (q?: string) => [...ROOT, "modifiers", "search", q ?? null] as const,
  },
  rowGroups: {
    all: () => [...ROOT, "row-groups"] as const,
  },
} as const;
