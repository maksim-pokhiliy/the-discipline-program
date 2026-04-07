import { HealthStatus } from "@repo/contracts/athlete-profile";
import { PlanEnrollmentStatus } from "@repo/contracts/plan-enrollment";

import type { EnrollmentWithData } from "./enrollment-query";

export const FAKE_NOW = new Date("2025-06-18T12:00:00Z");

export const makeWorkout = (
  id: string,
  scheduledDate: string | null,
  title = `Workout ${id}`,
  createdAt = "2025-06-01T00:00:00Z",
) => ({
  id,
  scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
  createdAt: new Date(createdAt),
  title,
});

export const makeLog = (workoutId: string, date: string) => ({
  id: `log-${workoutId}`,
  workoutId,
  date: new Date(date),
});

export const makeEnrollment = (overrides: {
  userId?: string;
  userName?: string | null;
  userEmail?: string;
  userImage?: string | null;
  healthStatus?: HealthStatus;
  hasProfile?: boolean;
  planId?: string;
  planName?: string;
  workouts?: ReturnType<typeof makeWorkout>[];
  logs?: ReturnType<typeof makeLog>[];
}): EnrollmentWithData =>
  ({
    id: `enrollment-${overrides.userId ?? "u1"}-${overrides.planId ?? "p1"}`,
    trainingPlanId: overrides.planId ?? "p1",
    userId: overrides.userId ?? "u1",
    startDate: new Date("2025-06-01T00:00:00Z"),
    endDate: null,
    status: PlanEnrollmentStatus.ACTIVE,
    createdAt: new Date("2025-06-01T00:00:00Z"),
    user: {
      id: overrides.userId ?? "u1",
      name: overrides.userName ?? "Test User",
      email: overrides.userEmail ?? "test@example.com",
      image: overrides.userImage ?? null,
      workoutLogs: overrides.logs ?? [],
      athleteProfile:
        overrides.hasProfile === false
          ? null
          : { healthStatus: overrides.healthStatus ?? HealthStatus.HEALTHY },
    },
    trainingPlan: {
      id: overrides.planId ?? "p1",
      name: overrides.planName ?? "Test Plan",
      workouts: overrides.workouts ?? [],
    },
  }) as unknown as EnrollmentWithData;
