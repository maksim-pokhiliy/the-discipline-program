import { createEntityKeys } from "./create-entity-keys";

export const platformKeys = {
  root: ["platform"] as const,

  trainingPlans: createEntityKeys(["platform"], "training-plans"),
  exercises: createEntityKeys(["platform"], "exercises"),
  exerciseCategories: {
    all: () => [...platformKeys.root, "exercise-categories"] as const,
  },
  athletes: createEntityKeys(["platform"], "athletes"),
  coachProfile: {
    me: () => [...platformKeys.root, "coach-profile"] as const,
  },
  athleteProfile: {
    me: () => [...platformKeys.root, "athlete-profile"] as const,
  },
  workoutLogs: createEntityKeys(["platform"], "workout-logs"),
  benchmarkDefinitions: createEntityKeys(["platform"], "benchmark-definitions"),
  coachDashboard: {
    data: () => [...platformKeys.root, "coach-dashboard"] as const,
  },
  coachNotes: createEntityKeys(["platform"], "coach-notes"),
  coachActionItems: {
    all: () => [...platformKeys.root, "coach-action-items"] as const,
  },
} as const;
