import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProcessStatus } from "@repo/contracts/coaching/coach-dashboard";

import { computeProcessStatus, computeProgressBuckets } from "./dashboard-computations";
import {
  FAKE_NOW,
  makeAssignedAthlete,
  makeLog,
  makeWorkout,
} from "./dashboard-computations.test-helpers";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FAKE_NOW);
});

afterEach(() => {
  vi.useRealTimers();
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
    const assignment = makeAssignedAthlete({
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

    const result = computeProgressBuckets([assignment]);

    expect(result.onTrack).toHaveLength(1);
    expect(result.steady).toHaveLength(0);
    expect(result.fallingBehind).toHaveLength(0);
  });

  it("places athlete with no recent completions but previous activity into fallingBehind", () => {
    const assignment = makeAssignedAthlete({
      userId: "u1",
      workouts: [
        makeWorkout("w1", "2025-06-05T10:00:00Z"),
        makeWorkout("w2", "2025-06-07T10:00:00Z"),
        makeWorkout("w3", "2025-06-12T10:00:00Z"),
        makeWorkout("w4", "2025-06-14T10:00:00Z"),
      ],
      logs: [makeLog("w1", "2025-06-05T12:00:00Z"), makeLog("w2", "2025-06-07T12:00:00Z")],
    });

    const result = computeProgressBuckets([assignment]);

    expect(result.fallingBehind).toHaveLength(1);
    expect(result.onTrack).toHaveLength(0);
  });

  it("calculates avgEngagementRate as athletes with logs / total athletes", () => {
    const active = makeAssignedAthlete({
      userId: "u1",
      workouts: [makeWorkout("w1", "2025-06-16T10:00:00Z")],
      logs: [makeLog("w1", "2025-06-16T12:00:00Z")],
    });

    const inactive = makeAssignedAthlete({
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

  it("aggregates workouts across multiple plan enrollments under one assignment", () => {
    const assignment = makeAssignedAthlete({
      userId: "u1",
      enrollments: [
        { planId: "p1", workouts: [makeWorkout("w1", "2025-06-14T10:00:00Z")] },
        { planId: "p2", workouts: [makeWorkout("w2", "2025-06-15T10:00:00Z")] },
      ],
      logs: [makeLog("w1", "2025-06-14T12:00:00Z"), makeLog("w2", "2025-06-15T12:00:00Z")],
    });

    const result = computeProgressBuckets([assignment]);
    const allAthletes = [...result.onTrack, ...result.steady, ...result.fallingBehind];

    expect(allAthletes).toHaveLength(1);
  });

  it("generates correct href for each athlete", () => {
    const assignment = makeAssignedAthlete({
      userId: "u-abc-123",
      workouts: [makeWorkout("w1", "2025-06-16T10:00:00Z")],
      logs: [makeLog("w1", "2025-06-16T12:00:00Z")],
    });

    const result = computeProgressBuckets([assignment]);
    const athlete = [...result.onTrack, ...result.steady, ...result.fallingBehind][0];

    if (!athlete) {
      throw new Error("expected athlete in buckets");
    }

    expect(athlete.userId).toBe("u-abc-123");
  });
});
