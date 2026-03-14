import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HealthStatus } from "@repo/contracts/athlete-profile";
import { LOW_COMPLETION_RATE, ProgressTrend, TodayStatus } from "@repo/contracts/coach-dashboard";

import {
  computeAthletesSummary,
  computeProgressBuckets,
  computeTodayStatus,
} from "./dashboard-computations";
import type { EnrollmentWithData } from "./enrollment-query";

const TZ = "UTC";

const FAKE_NOW = new Date("2025-06-18T12:00:00Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FAKE_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

const makeWorkout = (
  id: string,
  scheduledDate: string | null,
  title = `Workout ${id}`,
  createdAt = "2025-06-01T00:00:00Z",
) => ({
  id,
  scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
  createdAt: new Date(createdAt),
  title,
  blocks: [] as { categoryId: string; category: { id: string; name: string } }[],
});

const makeLog = (workoutId: string, date: string) => ({
  id: `log-${workoutId}`,
  workoutId,
  date: new Date(date),
});

const makeEnrollment = (overrides: {
  userId?: string;
  userName?: string | null;
  userEmail?: string;
  userImage?: string | null;
  healthStatus?: "HEALTHY" | "INJURED" | "RESTRICTED";
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
    status: "ACTIVE",
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
          : { healthStatus: overrides.healthStatus ?? "HEALTHY" },
    },
    trainingPlan: {
      id: overrides.planId ?? "p1",
      name: overrides.planName ?? "Test Plan",
      workouts: overrides.workouts ?? [],
    },
  }) as unknown as EnrollmentWithData;

describe("computeTodayStatus", () => {
  describe("NO_SCHEDULE", () => {
    it("returns NO_SCHEDULE when there are no workouts", () => {
      const result = computeTodayStatus([], [], TZ);

      expect(result.status).toBe(TodayStatus.NO_SCHEDULE);
      expect(result.missedCount).toBe(0);
      expect(result.currentWorkoutTitle).toBeNull();
      expect(result.lastActivityDate).toBeNull();
    });

    it("returns NO_SCHEDULE when all workouts have null scheduledDate", () => {
      const workouts = [makeWorkout("w1", null), makeWorkout("w2", null)];
      const result = computeTodayStatus(workouts, [], TZ);

      expect(result.status).toBe(TodayStatus.NO_SCHEDULE);
    });
  });

  describe("COMPLETED", () => {
    it("returns COMPLETED when all today's workouts are logged", () => {
      const workouts = [makeWorkout("w1", "2025-06-18T10:00:00Z", "Morning Session")];
      const logs = [makeLog("w1", "2025-06-18T11:00:00Z")];
      const result = computeTodayStatus(workouts, logs, TZ);

      expect(result.status).toBe(TodayStatus.COMPLETED);
      expect(result.currentWorkoutTitle).toBeNull();
    });

    it("returns COMPLETED when multiple today workouts are all logged", () => {
      const workouts = [
        makeWorkout("w1", "2025-06-18T08:00:00Z", "AM"),
        makeWorkout("w2", "2025-06-18T16:00:00Z", "PM"),
      ];
      const logs = [makeLog("w1", "2025-06-18T09:00:00Z"), makeLog("w2", "2025-06-18T17:00:00Z")];
      const result = computeTodayStatus(workouts, logs, TZ);

      expect(result.status).toBe(TodayStatus.COMPLETED);
    });
  });

  describe("PENDING", () => {
    it("returns PENDING when today has workouts but not all logged", () => {
      const workouts = [makeWorkout("w1", "2025-06-18T10:00:00Z", "Leg Day")];
      const result = computeTodayStatus(workouts, [], TZ);

      expect(result.status).toBe(TodayStatus.PENDING);
      expect(result.currentWorkoutTitle).toBe("Leg Day");
    });

    it("returns the first unlogged workout title as currentWorkoutTitle", () => {
      const workouts = [
        makeWorkout("w1", "2025-06-18T08:00:00Z", "Morning"),
        makeWorkout("w2", "2025-06-18T14:00:00Z", "Afternoon"),
      ];
      const logs = [makeLog("w1", "2025-06-18T09:00:00Z")];
      const result = computeTodayStatus(workouts, logs, TZ);

      expect(result.status).toBe(TodayStatus.PENDING);
      expect(result.currentWorkoutTitle).toBe("Afternoon");
    });
  });

  describe("MISSED", () => {
    it("returns MISSED when no today workouts but past workouts this week are unlogged", () => {
      const workouts = [makeWorkout("w1", "2025-06-17T10:00:00Z", "Yesterday Workout")];
      const result = computeTodayStatus(workouts, [], TZ);

      expect(result.status).toBe(TodayStatus.MISSED);
      expect(result.missedCount).toBe(1);
    });
  });

  describe("REST_DAY", () => {
    it("returns REST_DAY when no today workouts and no missed this week", () => {
      const workouts = [makeWorkout("w1", "2025-06-25T10:00:00Z", "Next Week")];
      const result = computeTodayStatus(workouts, [], TZ);

      expect(result.status).toBe(TodayStatus.REST_DAY);
      expect(result.missedCount).toBe(0);
    });

    it("returns REST_DAY when past workouts this week are all logged", () => {
      const workouts = [makeWorkout("w1", "2025-06-17T10:00:00Z", "Done Yesterday")];
      const logs = [makeLog("w1", "2025-06-17T15:00:00Z")];
      const result = computeTodayStatus(workouts, logs, TZ);

      expect(result.status).toBe(TodayStatus.REST_DAY);
      expect(result.missedCount).toBe(0);
    });
  });

  describe("missedCount", () => {
    it("counts consecutive missed workouts from most recent backwards", () => {
      const workouts = [
        makeWorkout("w1", "2025-06-16T10:00:00Z"),
        makeWorkout("w2", "2025-06-17T10:00:00Z"),
      ];
      const result = computeTodayStatus(workouts, [], TZ);

      expect(result.missedCount).toBe(2);
    });

    it("stops counting at the first logged workout", () => {
      const workouts = [
        makeWorkout("w1", "2025-06-16T10:00:00Z"),
        makeWorkout("w2", "2025-06-17T10:00:00Z"),
      ];
      const logs = [makeLog("w2", "2025-06-17T15:00:00Z")];
      const result = computeTodayStatus(workouts, logs, TZ);

      expect(result.missedCount).toBe(0);
    });

    it("only counts workouts created on or before their scheduled date", () => {
      const workouts = [
        makeWorkout("w1", "2025-06-16T10:00:00Z", "Normal", "2025-06-15T00:00:00Z"),
        makeWorkout("w2", "2025-06-17T10:00:00Z", "Backdated", "2025-06-18T00:00:00Z"),
      ];
      const result = computeTodayStatus(workouts, [], TZ);

      expect(result.missedCount).toBe(1);
    });
  });

  describe("lastActivityDate", () => {
    it("returns null when there are no logs", () => {
      const workouts = [makeWorkout("w1", "2025-06-18T10:00:00Z")];
      const result = computeTodayStatus(workouts, [], TZ);

      expect(result.lastActivityDate).toBeNull();
    });

    it("returns the most recent log date", () => {
      const workouts = [makeWorkout("w1", "2025-06-18T10:00:00Z")];
      const logs = [
        makeLog("w1", "2025-06-15T10:00:00Z"),
        makeLog("w2", "2025-06-17T10:00:00Z"),
        makeLog("w3", "2025-06-10T10:00:00Z"),
      ];
      const result = computeTodayStatus(workouts, logs, TZ);

      expect(result.lastActivityDate).toEqual(new Date("2025-06-17T10:00:00Z"));
    });
  });
});

describe("computeAthletesSummary", () => {
  it("returns summary for a single enrollment", () => {
    const enrollment = makeEnrollment({
      userId: "u1",
      userName: "Alice",
      userEmail: "alice@test.com",
      planId: "p1",
      planName: "Strength Program",
      workouts: [makeWorkout("w1", "2025-06-18T10:00:00Z", "Squats")],
      logs: [],
    });

    const result = computeAthletesSummary([enrollment], TZ);

    expect(result).toHaveLength(1);
    const athlete = result[0];

    if (!athlete) {
      throw new Error("expected athlete");
    }

    expect(athlete.userId).toBe("u1");
    expect(athlete.name).toBe("Alice");
    expect(athlete.email).toBe("alice@test.com");
    expect(athlete.planId).toBe("p1");
    expect(athlete.planName).toBe("Strength Program");
    expect(athlete.todayStatus).toBe(TodayStatus.PENDING);
    expect(athlete.todayWorkoutTitle).toBe("Squats");
    expect(athlete.healthStatus).toBe(HealthStatus.HEALTHY);
  });

  it("picks highest priority status when athlete has multiple enrollments", () => {
    const enrollment1 = makeEnrollment({
      userId: "u1",
      planId: "p1",
      workouts: [makeWorkout("w1", "2025-06-25T10:00:00Z")],
      logs: [],
    });

    const enrollment2 = makeEnrollment({
      userId: "u1",
      planId: "p2",
      planName: "Plan 2",
      workouts: [makeWorkout("w2", "2025-06-17T10:00:00Z")],
      logs: [],
    });

    const result = computeAthletesSummary([enrollment1, enrollment2], TZ);

    expect(result).toHaveLength(1);
    const athlete = result[0];

    if (!athlete) {
      throw new Error("expected athlete");
    }

    expect(athlete.todayStatus).toBe(TodayStatus.MISSED);
    expect(athlete.planId).toBe("p2");
  });

  it("aggregates missedCount — keeps higher count even from lower priority enrollment", () => {
    const enrollment1 = makeEnrollment({
      userId: "u1",
      planId: "p1",
      workouts: [makeWorkout("w1", "2025-06-17T10:00:00Z")],
      logs: [],
    });

    const enrollment2 = makeEnrollment({
      userId: "u1",
      planId: "p2",
      workouts: [
        makeWorkout("w2", "2025-06-16T10:00:00Z"),
        makeWorkout("w3", "2025-06-17T10:00:00Z"),
        makeWorkout("w4", "2025-06-18T10:00:00Z", "Today"),
      ],
      logs: [],
    });

    const result = computeAthletesSummary([enrollment1, enrollment2], TZ);

    expect(result).toHaveLength(1);
    const athlete = result[0];

    if (!athlete) {
      throw new Error("expected athlete");
    }

    expect(athlete.missedCount).toBe(2);
  });

  it("maps healthStatus from athleteProfile", () => {
    const enrollment = makeEnrollment({
      healthStatus: "INJURED",
      workouts: [],
    });

    const result = computeAthletesSummary([enrollment], TZ);
    const athlete = result[0];

    if (!athlete) {
      throw new Error("expected athlete");
    }

    expect(athlete.healthStatus).toBe(HealthStatus.INJURED);
  });

  it("defaults to HEALTHY when athleteProfile is null", () => {
    const enrollment = makeEnrollment({
      hasProfile: false,
      workouts: [],
    });

    const result = computeAthletesSummary([enrollment], TZ);
    const athlete = result[0];

    if (!athlete) {
      throw new Error("expected athlete");
    }

    expect(athlete.healthStatus).toBe(HealthStatus.HEALTHY);
  });

  it("computes daysSinceLastActivity", () => {
    const enrollment = makeEnrollment({
      workouts: [makeWorkout("w1", "2025-06-18T10:00:00Z")],
      logs: [makeLog("w-old", "2025-06-15T10:00:00Z")],
    });

    const result = computeAthletesSummary([enrollment], TZ);
    const athlete = result[0];

    if (!athlete) {
      throw new Error("expected athlete");
    }

    expect(athlete.daysSinceLastActivity).toBe(3);
  });

  it("returns null daysSinceLastActivity when no logs", () => {
    const enrollment = makeEnrollment({
      workouts: [makeWorkout("w1", "2025-06-18T10:00:00Z")],
      logs: [],
    });

    const result = computeAthletesSummary([enrollment], TZ);
    const athlete = result[0];

    if (!athlete) {
      throw new Error("expected athlete");
    }

    expect(athlete.daysSinceLastActivity).toBeNull();
  });
});

describe("computeProgressBuckets", () => {
  it("places athlete with high completion rate (>=0.7) into improving with UP trend", () => {
    const enrollment = makeEnrollment({
      userId: "u1",
      userName: "Strong Athlete",
      workouts: [
        makeWorkout("w1", "2025-06-16T10:00:00Z"),
        makeWorkout("w2", "2025-06-17T10:00:00Z"),
        makeWorkout("w3", "2025-06-18T10:00:00Z"),
      ],
      logs: [
        makeLog("w1", "2025-06-16T12:00:00Z"),
        makeLog("w2", "2025-06-17T12:00:00Z"),
        makeLog("w3", "2025-06-18T12:00:00Z"),
      ],
    });

    const result = computeProgressBuckets([enrollment]);

    expect(result.improving).toHaveLength(1);
    const athlete = result.improving[0];

    if (!athlete) {
      throw new Error("expected improving athlete");
    }

    expect(athlete.trend).toBe(ProgressTrend.UP);
    expect(athlete.completionRate).toBeCloseTo(1.0);
    expect(result.stagnating).toHaveLength(0);
    expect(result.declining).toHaveLength(0);
  });

  it("places athlete with low completion rate (<LOW_COMPLETION_RATE) into declining with DOWN trend", () => {
    const workouts = Array.from({ length: 10 }, (_, i) =>
      makeWorkout(`w${i}`, `2025-06-${String(10 + i).padStart(2, "0")}T10:00:00Z`),
    );
    const enrollment = makeEnrollment({
      userId: "u1",
      workouts,
      logs: [makeLog("w0", "2025-06-10T12:00:00Z")],
    });

    const result = computeProgressBuckets([enrollment]);

    expect(result.declining).toHaveLength(1);
    const athlete = result.declining[0];

    if (!athlete) {
      throw new Error("expected declining athlete");
    }

    expect(athlete.trend).toBe(ProgressTrend.DOWN);
    expect(athlete.completionRate).toBeLessThan(LOW_COMPLETION_RATE);
  });

  it("places athlete with medium completion rate into stagnating with STABLE trend", () => {
    const workouts = Array.from({ length: 10 }, (_, i) =>
      makeWorkout(`w${i}`, `2025-06-${String(10 + i).padStart(2, "0")}T10:00:00Z`),
    );
    const logs = Array.from({ length: 5 }, (_, i) =>
      makeLog(`w${i}`, `2025-06-${String(10 + i).padStart(2, "0")}T12:00:00Z`),
    );
    const enrollment = makeEnrollment({
      userId: "u1",
      workouts,
      logs,
    });

    const result = computeProgressBuckets([enrollment]);

    expect(result.stagnating).toHaveLength(1);
    const athlete = result.stagnating[0];

    if (!athlete) {
      throw new Error("expected stagnating athlete");
    }

    expect(athlete.trend).toBe(ProgressTrend.STABLE);
    expect(athlete.completionRate).toBe(0.5);
  });

  it("calculates avgEngagementRate as active athletes / total athletes", () => {
    const active = makeEnrollment({
      userId: "u1",
      workouts: [makeWorkout("w1", "2025-06-18T10:00:00Z")],
      logs: [makeLog("w1", "2025-06-18T12:00:00Z")],
    });

    const inactive = makeEnrollment({
      userId: "u2",
      userEmail: "inactive@test.com",
      workouts: [makeWorkout("w2", "2025-06-18T10:00:00Z")],
      logs: [],
    });

    const result = computeProgressBuckets([active, inactive]);

    expect(result.avgEngagementRate).toBe(0.5);
  });

  it("returns 0 engagement rate when there are no enrollments", () => {
    const result = computeProgressBuckets([]);

    expect(result.avgEngagementRate).toBe(0);
    expect(result.improving).toHaveLength(0);
    expect(result.stagnating).toHaveLength(0);
    expect(result.declining).toHaveLength(0);
  });

  it("returns rate 0 and DOWN trend for athlete with workouts but zero completions", () => {
    const enrollment = makeEnrollment({
      userId: "u1",
      workouts: [makeWorkout("w1", "2025-06-18T10:00:00Z")],
      logs: [],
    });

    const result = computeProgressBuckets([enrollment]);

    expect(result.declining).toHaveLength(1);
    const athlete = result.declining[0];

    if (!athlete) {
      throw new Error("expected declining athlete");
    }

    expect(athlete.completionRate).toBe(0);
    expect(athlete.trend).toBe(ProgressTrend.DOWN);
  });

  it("returns rate 0 and DOWN trend for athlete with zero workouts", () => {
    const enrollment = makeEnrollment({
      userId: "u1",
      workouts: [],
      logs: [],
    });

    const result = computeProgressBuckets([enrollment]);

    expect(result.declining).toHaveLength(1);
    const athlete = result.declining[0];

    if (!athlete) {
      throw new Error("expected declining athlete");
    }

    expect(athlete.completionRate).toBe(0);
  });

  it("aggregates workouts across multiple enrollments for the same athlete", () => {
    const enrollment1 = makeEnrollment({
      userId: "u1",
      planId: "p1",
      workouts: [
        makeWorkout("w1", "2025-06-16T10:00:00Z"),
        makeWorkout("w2", "2025-06-17T10:00:00Z"),
      ],
      logs: [makeLog("w1", "2025-06-16T12:00:00Z"), makeLog("w2", "2025-06-17T12:00:00Z")],
    });

    const enrollment2 = makeEnrollment({
      userId: "u1",
      planId: "p2",
      workouts: [
        makeWorkout("w3", "2025-06-16T10:00:00Z"),
        makeWorkout("w4", "2025-06-17T10:00:00Z"),
      ],
      logs: [makeLog("w3", "2025-06-16T12:00:00Z"), makeLog("w4", "2025-06-17T12:00:00Z")],
    });

    const result = computeProgressBuckets([enrollment1, enrollment2]);

    expect(result.improving).toHaveLength(1);
    const athlete = result.improving[0];

    if (!athlete) {
      throw new Error("expected improving athlete");
    }

    expect(athlete.completionRate).toBe(1.0);
  });

  it("generates correct href for each athlete", () => {
    const enrollment = makeEnrollment({
      userId: "u-abc-123",
      workouts: [makeWorkout("w1", "2025-06-18T10:00:00Z")],
      logs: [makeLog("w1", "2025-06-18T12:00:00Z")],
    });

    const result = computeProgressBuckets([enrollment]);
    const athlete = [...result.improving, ...result.stagnating, ...result.declining][0];

    if (!athlete) {
      throw new Error("expected athlete in buckets");
    }

    expect(athlete.href).toBe("/coach/athletes/u-abc-123");
  });
});
