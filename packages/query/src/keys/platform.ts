import { createEntityKeys } from "./create-entity-keys";

export const platformKeys = {
  root: ["platform"] as const,

  trainingPlans: createEntityKeys(["platform"], "training-plans"),
  workouts: {
    ...createEntityKeys(["platform"], "workouts"),
    byPlan: (planId: string) => [...platformKeys.root, "workouts", "plan", planId] as const,
    preview: (workoutId: string) =>
      [...platformKeys.root, "workouts", "preview", workoutId] as const,
  },
  workoutBlocks: {
    ...createEntityKeys(["platform"], "workout-blocks"),
    byWorkout: (workoutId: string) =>
      [...platformKeys.root, "workout-blocks", "workout", workoutId] as const,
  },
  prescribedSets: {
    ...createEntityKeys(["platform"], "prescribed-sets"),
    byBlock: (blockId: string) =>
      [...platformKeys.root, "prescribed-sets", "block", blockId] as const,
  },
  planEnrollments: {
    ...createEntityKeys(["platform"], "plan-enrollments"),
    byPlan: (planId: string) => [...platformKeys.root, "plan-enrollments", "plan", planId] as const,
  },
  athleteMaxes: {
    ...createEntityKeys(["platform"], "athlete-maxes"),
    forPlanExercises: (planId: string, exerciseIds: string[]) =>
      [...platformKeys.root, "athlete-maxes", "plan", planId, ...exerciseIds.sort()] as const,
  },
  calendar: {
    week: (weekStart: string) => [...platformKeys.root, "calendar", weekStart] as const,
  },
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
