import type { AppLevelValue } from "@repo/contracts/lms/label";
import type { EnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
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
  athleteProfile: {
    data: () => [...ROOT, "athlete-profile"] as const,
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
  planEnrollments: {
    byPlan: (planId: string, status?: EnrollmentStatus) =>
      [...ROOT, "training-plans", planId, "enrollments", status ?? "live"] as const,
  },
  labels: {
    search: (level?: AppLevelValue, q?: string) =>
      [...ROOT, "labels", "search", level ?? null, q ?? null] as const,
  },
  exercises: {
    all: () => [...ROOT, "exercises"] as const,
    forAthlete: () => [...ROOT, "exercises", "athlete"] as const,
  },
  modifiers: {
    search: (q?: string) => [...ROOT, "modifiers", "search", q ?? null] as const,
  },
  oneRMRecords: {
    list: (exerciseId?: string) => [...ROOT, "one-rm-records", exerciseId ?? null] as const,
  },
  planTimetable: {
    data: () => [...ROOT, "plan-timetable"] as const,
  },
  profileAxes: {
    all: () => [...ROOT, "profile-axes"] as const,
    forAthlete: () => [...ROOT, "profile-axes", "athlete"] as const,
  },
  athleteRecords: {
    data: () => [...ROOT, "athlete-records"] as const,
  },
  athleteSessionView: {
    detail: (sessionId: string) => [...ROOT, "athlete-session-view", sessionId] as const,
  },
  rowGroups: {
    all: () => [...ROOT, "row-groups"] as const,
  },
  mobile: {
    connections: () => [...ROOT, "mobile", "connections"] as const,
    trainingLevels: () => [...ROOT, "mobile", "training-levels"] as const,
    athletes: () => [...ROOT, "mobile", "athletes"] as const,
    links: (planId: string) => [...ROOT, "mobile", "links", planId] as const,
  },
} as const;
