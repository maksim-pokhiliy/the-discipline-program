import { createEntityKeys } from "@repo/query";
import { formatDateParam } from "@repo/shared";

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
  planDays: {
    byWeek: (planId: string, weekStart: Date) =>
      [...ROOT, "plan-days", planId, "week", formatDateParam(weekStart)] as const,
  },
  planSessions: {
    byDay: (planId: string, dayId: string) => [...ROOT, "plan-sessions", planId, dayId] as const,
  },
  planBlocks: {
    bySession: (planId: string, sessionId: string) =>
      [...ROOT, "plan-blocks", planId, sessionId] as const,
  },
  planItems: {
    byBlock: (planId: string, blockId: string) => [...ROOT, "plan-items", planId, blockId] as const,
  },
  library: {
    all: () => [...ROOT, "library"] as const,
  },
} as const;
