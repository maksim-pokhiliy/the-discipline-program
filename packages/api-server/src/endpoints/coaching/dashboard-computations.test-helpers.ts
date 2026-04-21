import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import { PlanEnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";

import type { AssignedAthleteWithData } from "./assigned-athlete-query";

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

export type PlanEnrollmentOverride = {
  planId: string;
  planName?: string;
  workouts?: ReturnType<typeof makeWorkout>[];
  startDate?: Date;
};

export const makeAssignedAthlete = (overrides: {
  userId?: string;
  userName?: string | null;
  userEmail?: string;
  userImage?: string | null;
  healthStatus?: HealthStatus;
  hasProfile?: boolean;
  planId?: string;
  planName?: string;
  workouts?: ReturnType<typeof makeWorkout>[];
  enrollments?: PlanEnrollmentOverride[];
  logs?: ReturnType<typeof makeLog>[];
  enrolled?: boolean;
  assignmentCreatedAt?: Date;
  assignmentUpdatedAt?: Date;
  coachId?: string;
}): AssignedAthleteWithData => {
  const userId = overrides.userId ?? "u1";
  const coachId = overrides.coachId ?? "c1";
  const planId = overrides.planId ?? "p1";
  const enrolled = overrides.enrolled ?? true;
  const assignmentCreatedAt = overrides.assignmentCreatedAt ?? new Date("2025-06-01T00:00:00Z");
  const assignmentUpdatedAt = overrides.assignmentUpdatedAt ?? assignmentCreatedAt;

  const resolvedEnrollments: PlanEnrollmentOverride[] = overrides.enrollments ?? [
    { planId, planName: overrides.planName, workouts: overrides.workouts },
  ];

  const planEnrollments = enrolled
    ? resolvedEnrollments.map((e) => ({
        id: `enrollment-${userId}-${e.planId}`,
        status: PlanEnrollmentStatus.ACTIVE,
        startDate: e.startDate ?? new Date("2025-06-01T00:00:00Z"),
        trainingPlan: {
          id: e.planId,
          name: e.planName ?? "Test Plan",
          coachId,
          workouts: e.workouts ?? [],
        },
      }))
    : [];

  return {
    id: `assignment-${coachId}-${userId}`,
    coachId,
    athleteId: userId,
    createdAt: assignmentCreatedAt,
    updatedAt: assignmentUpdatedAt,
    athlete: {
      id: userId,
      name: overrides.userName ?? "Test User",
      email: overrides.userEmail ?? "test@example.com",
      image: overrides.userImage ?? null,
      workoutLogs: overrides.logs ?? [],
      athleteProfile:
        overrides.hasProfile === false
          ? null
          : { healthStatus: overrides.healthStatus ?? HealthStatus.HEALTHY },
      planEnrollments,
    },
  } as unknown as AssignedAthleteWithData;
};
