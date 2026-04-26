import { describe, expect, it } from "vitest";

import { ProcessStatus } from "@repo/contracts/coaching/coach-dashboard";

import { computeProcessStatus, computeProgressBuckets } from "./dashboard-computations";

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
  it("returns empty buckets when there are no enrollments", () => {
    const result = computeProgressBuckets([]);

    expect(result.avgEngagementRate).toBe(0);
    expect(result.onTrack).toHaveLength(0);
    expect(result.steady).toHaveLength(0);
    expect(result.fallingBehind).toHaveLength(0);
  });
});
