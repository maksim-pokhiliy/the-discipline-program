import { createEntityKeys } from "@repo/query";

const ROOT = ["platform"] as const;

export const platformKeys = {
  root: ROOT,

  trainingPlans: createEntityKeys(ROOT, "training-plans"),
  workouts: {
    ...createEntityKeys(ROOT, "workouts"),
    byPlan: (planId: string) => [...ROOT, "workouts", "plan", planId] as const,
  },
  planEnrollments: {
    ...createEntityKeys(ROOT, "plan-enrollments"),
    byPlan: (planId: string) => [...ROOT, "plan-enrollments", "plan", planId] as const,
  },
  users: {
    search: (query: string) => [...ROOT, "users", "search", query] as const,
  },
  calendar: {
    all: () => [...ROOT, "calendar"] as const,
    week: (weekStart: string) => [...ROOT, "calendar", weekStart] as const,
  },
  athletes: createEntityKeys(ROOT, "athletes"),
  coachDashboard: {
    data: () => [...ROOT, "coach-dashboard"] as const,
  },
  coachActionItems: {
    all: () => [...ROOT, "coach-action-items"] as const,
  },
} as const;
