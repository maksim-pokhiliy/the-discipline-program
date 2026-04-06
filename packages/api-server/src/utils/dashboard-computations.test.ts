import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HealthStatus } from "@repo/contracts/athlete-profile";
import { ProcessStatus, TodayStatus } from "@repo/contracts/coach-dashboard";

import {
  computeAthletesSummary,
  computeProcessStatus,
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

describe("computeProcessStatus", () => {
  it("returns ON_TRACK when current adherence is significantly better than previous", () => {
    expect(computeProcessStatus(0.8, 0.5)).toBe(ProcessStatus.ON_TRACK);
  });

  it("returns FALLING_BEHIND when current adherence is significantly worse", () => {
    expect(computeProcessStatus(0.3, 0.7)).toBe(ProcessStatus.FALLING_BEHIND);
  });

  it("returns ON_TRACK when adherence is stable and high", () => {
    expect(computeProcessStatus(0.8, 0.8)).toBe(ProcessStatus.ON_TRACK);
  });

  it("returns STEADY when adherence is stable and moderate", () => {
    expect(computeProcessStatus(0.5, 0.5)).toBe(ProcessStatus.STEADY);
  });

  it("returns STEADY when delta is within threshold", () => {
    expect(computeProcessStatus(0.55, 0.5)).toBe(ProcessStatus.STEADY);
  });
});

describe("computeProgressBuckets", () => {
  it("places athlete with all recent workouts completed into onTrack", () => {
    const enrollment = makeEnrollment({
      userId: "u1",
      userName: "Strong Athlete",
      workouts: [
        makeWorkout("w1", "2025-06-12T10:00:00Z"),
        makeWorkout("w2", "2025-06-14T10:00:00Z"),
        makeWorkout("w3", "2025-06-16T10:00:00Z"),
      ],
      logs: [
        makeLog("w1", "2025-06-12T12:00:00Z"),
        makeLog("w2", "2025-06-14T12:00:00Z"),
        makeLog("w3", "2025-06-16T12:00:00Z"),
      ],
    });

    const result = computeProgressBuckets([enrollment]);

    expect(result.onTrack).toHaveLength(1);
    expect(result.steady).toHaveLength(0);
    expect(result.fallingBehind).toHaveLength(0);
  });

  it("places athlete with no recent completions but previous activity into fallingBehind", () => {
    const enrollment = makeEnrollment({
      userId: "u1",
      workouts: [
        makeWorkout("w1", "2025-06-05T10:00:00Z"),
        makeWorkout("w2", "2025-06-07T10:00:00Z"),
        makeWorkout("w3", "2025-06-12T10:00:00Z"),
        makeWorkout("w4", "2025-06-14T10:00:00Z"),
      ],
      logs: [makeLog("w1", "2025-06-05T12:00:00Z"), makeLog("w2", "2025-06-07T12:00:00Z")],
    });

    const result = computeProgressBuckets([enrollment]);

    expect(result.fallingBehind).toHaveLength(1);
    expect(result.onTrack).toHaveLength(0);
  });

  it("calculates avgEngagementRate as athletes with logs / total athletes", () => {
    const active = makeEnrollment({
      userId: "u1",
      workouts: [makeWorkout("w1", "2025-06-16T10:00:00Z")],
      logs: [makeLog("w1", "2025-06-16T12:00:00Z")],
    });

    const inactive = makeEnrollment({
      userId: "u2",
      userEmail: "inactive@test.com",
      workouts: [makeWorkout("w2", "2025-06-16T10:00:00Z")],
      logs: [],
    });

    const result = computeProgressBuckets([active, inactive]);

    expect(result.avgEngagementRate).toBe(0.5);
  });

  it("returns empty buckets when there are no enrollments", () => {
    const result = computeProgressBuckets([]);

    expect(result.avgEngagementRate).toBe(0);
    expect(result.onTrack).toHaveLength(0);
    expect(result.steady).toHaveLength(0);
    expect(result.fallingBehind).toHaveLength(0);
  });

  it("aggregates workouts across multiple enrollments for the same athlete", () => {
    const enrollment1 = makeEnrollment({
      userId: "u1",
      planId: "p1",
      workouts: [makeWorkout("w1", "2025-06-14T10:00:00Z")],
      logs: [makeLog("w1", "2025-06-14T12:00:00Z")],
    });

    const enrollment2 = makeEnrollment({
      userId: "u1",
      planId: "p2",
      workouts: [makeWorkout("w2", "2025-06-15T10:00:00Z")],
      logs: [makeLog("w2", "2025-06-15T12:00:00Z")],
    });

    const result = computeProgressBuckets([enrollment1, enrollment2]);
    const allAthletes = [...result.onTrack, ...result.steady, ...result.fallingBehind];

    expect(allAthletes).toHaveLength(1);
  });

  it("generates correct href for each athlete", () => {
    const enrollment = makeEnrollment({
      userId: "u-abc-123",
      workouts: [makeWorkout("w1", "2025-06-16T10:00:00Z")],
      logs: [makeLog("w1", "2025-06-16T12:00:00Z")],
    });

    const result = computeProgressBuckets([enrollment]);
    const athlete = [...result.onTrack, ...result.steady, ...result.fallingBehind][0];

    if (!athlete) {
      throw new Error("expected athlete in buckets");
    }

    expect(athlete.href).toBe("/coach/athletes/u-abc-123");
  });
});
