import { createEntityKeys } from "@repo/query";

const ROOT = ["platform"] as const;

export const platformKeys = {
  root: ROOT,

  trainingPlans: {
    ...createEntityKeys(ROOT, "training-plans"),
    structure: (planId: string, fromWeek: number | undefined, toWeek: number | undefined) =>
      [...ROOT, "training-plans", "structure", planId, fromWeek ?? null, toWeek ?? null] as const,
    structureByPlan: (planId: string) => [...ROOT, "training-plans", "structure", planId] as const,
  },
  planEnrollments: {
    ...createEntityKeys(ROOT, "plan-enrollments"),
    byPlan: (planId: string) => [...ROOT, "plan-enrollments", "plan", planId] as const,
  },
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
  library: {
    exercises: {
      ...createEntityKeys(ROOT, "library-exercises"),
      bySearch: (query: string) => [...ROOT, "library-exercises", "search", query] as const,
    },
    blockKinds: {
      ...createEntityKeys(ROOT, "library-block-kinds"),
      bySearch: (query: string) => [...ROOT, "library-block-kinds", "search", query] as const,
    },
    schemeTemplates: {
      ...createEntityKeys(ROOT, "library-scheme-templates"),
      bySearch: (query: string) => [...ROOT, "library-scheme-templates", "search", query] as const,
    },
  },
} as const;
