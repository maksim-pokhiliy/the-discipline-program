import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AthleteConsistency, Last7Day } from "@repo/contracts/coaching/coach-athletes";
import { TodayStatus } from "@repo/contracts/coaching/coach-dashboard";

import { render } from "@app/test/render";

import { TodayPane } from "./today-pane";

const DAY_MS = 24 * 60 * 60 * 1000;
const BASE = new Date("2026-06-16T09:00:00.000Z").getTime();

const STATUS_CYCLE: TodayStatus[] = [
  TodayStatus.COMPLETED,
  TodayStatus.MISSED,
  TodayStatus.REST_DAY,
  TodayStatus.COMPLETED,
  TodayStatus.COMPLETED,
  TodayStatus.MISSED,
  TodayStatus.PENDING,
];

const makeLast7Days = (): Last7Day[] =>
  STATUS_CYCLE.map((status, index) => ({
    date: new Date(BASE - (STATUS_CYCLE.length - 1 - index) * DAY_MS),
    status,
  }));

const makeConsistency = (overrides: Partial<AthleteConsistency> = {}): AthleteConsistency => ({
  adherenceRate4w: 0.72,
  currentStreak: 3,
  missedThisWeek: 1,
  ...overrides,
});

const renderPane = (props: Partial<React.ComponentProps<typeof TodayPane>> = {}) =>
  render(
    <TodayPane
      todayWorkoutTitle="Back Squat 5x5"
      planName="Strength Block"
      currentWeek={3}
      totalWeeks={8}
      last7Days={makeLast7Days()}
      consistency={makeConsistency()}
      {...props}
    />,
  );

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TodayPane today session", () => {
  it("renders the workout title, plan name and week of cycle", () => {
    renderPane();

    expect(screen.getByText("Back Squat 5x5")).toBeInTheDocument();
    expect(screen.getByText("Strength Block")).toBeInTheDocument();
    expect(screen.getByText("Week 3 / 8")).toBeInTheDocument();
  });

  it("falls back to a no-session label when there is no workout today", () => {
    renderPane({ todayWorkoutTitle: null });

    expect(screen.getByText("No session today")).toBeInTheDocument();
  });

  it("shows the week count when there is no current week", () => {
    renderPane({ currentWeek: null, totalWeeks: 8 });

    expect(screen.getByText("8 weeks")).toBeInTheDocument();
  });
});

describe("TodayPane consistency stats", () => {
  it("renders the four-week adherence, streak and missed-this-week stats", () => {
    renderPane({ consistency: makeConsistency({ adherenceRate4w: 0.72 }) });

    expect(screen.getByText("72%")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});

describe("TodayPane last seven days", () => {
  it("renders the seven-day strip with its legend", () => {
    renderPane();

    expect(screen.getByText("Last 7 days")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("Missed")).toBeInTheDocument();
    expect(screen.getByText("Rest")).toBeInTheDocument();
  });
});
