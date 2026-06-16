import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { formatTimeAgo } from "./format-time-ago";

const NOW = new Date("2026-06-16T12:00:00.000Z");

const minutesAgo = (minutes: number): Date => new Date(NOW.getTime() - minutes * 60_000);
const hoursAgo = (hours: number): Date => new Date(NOW.getTime() - hours * 3_600_000);
const daysAgo = (days: number): Date => new Date(NOW.getTime() - days * 86_400_000);

describe("formatTimeAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders minutes for under an hour", () => {
    expect(formatTimeAgo(minutesAgo(5))).toBe("5m ago");
  });

  it("renders 0m ago for the current moment", () => {
    expect(formatTimeAgo(NOW)).toBe("0m ago");
  });

  it("renders hours once past the 60-minute boundary", () => {
    expect(formatTimeAgo(hoursAgo(3))).toBe("3h ago");
  });

  it("renders days once past the 24-hour boundary", () => {
    expect(formatTimeAgo(daysAgo(2))).toBe("2d ago");
  });

  it("renders 6d ago at the last relative day", () => {
    expect(formatTimeAgo(daysAgo(6))).toBe("6d ago");
  });

  it("falls back to a short date beyond seven days", () => {
    expect(formatTimeAgo(daysAgo(8))).toBe("Jun 8");
  });

  it("accepts an ISO string", () => {
    expect(formatTimeAgo(minutesAgo(10).toISOString())).toBe("10m ago");
  });
});
