import { screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import { ActionItemSeverity, ActionItemType } from "@repo/contracts/coaching/coach-action-item";
import {
  type AthleteDailySummary,
  type DashboardActionItem,
  TodayStatus,
} from "@repo/contracts/coaching/coach-dashboard";

import { render } from "@app/test/render";

import { PulseBandSection } from "./pulse-band-section";

const NOW = new Date("2026-06-16T09:00:00.000Z");

const makeActionItem = (severity: ActionItemSeverity, id: string): DashboardActionItem => ({
  id,
  type: ActionItemType.MISSED_WORKOUTS,
  severity,
  athleteId: "clz00000000000000000ath1",
  athleteName: "Aria",
  athleteImage: null,
  message: "missed",
  createdAt: NOW,
});

const makeAthlete = (todayStatus: TodayStatus, userId: string): AthleteDailySummary => ({
  userId,
  name: "Athlete",
  email: "a@example.com",
  image: null,
  planId: "clz00000000000000000pln1",
  planName: "Plan",
  todayStatus,
  missedCount: 0,
  todayWorkoutTitle: null,
  lastActivityDate: NOW,
  daysSinceLastActivity: 1,
  healthStatus: HealthStatus.HEALTHY,
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("PulseBandSection cells", () => {
  it("renders three cells with their labels", () => {
    render(<PulseBandSection actionItems={[]} athletes={[]} totalActiveAthletes={0} />);

    const group = screen.getByRole("group");

    expect(within(group).getByText("Need attention")).toBeInTheDocument();
    expect(within(group).getByText(/Trained today/)).toBeInTheDocument();
    expect(within(group).getByText("Active athletes")).toBeInTheDocument();
  });

  it("shows the action-item count and active-athlete total", () => {
    render(
      <PulseBandSection
        actionItems={[makeActionItem(ActionItemSeverity.WARNING, "clz00000000000000000ai01")]}
        athletes={[]}
        totalActiveAthletes={7}
      />,
    );

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });
});

describe("PulseBandSection trained-today grouping", () => {
  it("computes the trained total from missed + pending + completed and shows the percentage", () => {
    const athletes = [
      makeAthlete(TodayStatus.MISSED, "clz00000000000000000ath1"),
      makeAthlete(TodayStatus.PENDING, "clz00000000000000000ath2"),
      makeAthlete(TodayStatus.COMPLETED, "clz00000000000000000ath3"),
      makeAthlete(TodayStatus.COMPLETED, "clz00000000000000000ath4"),
      makeAthlete(TodayStatus.REST_DAY, "clz00000000000000000ath5"),
      makeAthlete(TodayStatus.NO_SCHEDULE, "clz00000000000000000ath6"),
    ];

    render(<PulseBandSection actionItems={[]} athletes={athletes} totalActiveAthletes={6} />);

    expect(screen.getByText(/Trained today · 50%/)).toBeInTheDocument();
    expect(screen.getByText("/ 4")).toBeInTheDocument();
  });

  it("falls back to a zero percentage when nobody is scheduled today", () => {
    const athletes = [
      makeAthlete(TodayStatus.REST_DAY, "clz00000000000000000ath1"),
      makeAthlete(TodayStatus.NO_SCHEDULE, "clz00000000000000000ath2"),
    ];

    render(<PulseBandSection actionItems={[]} athletes={athletes} totalActiveAthletes={2} />);

    expect(screen.getByText(/Trained today · 0%/)).toBeInTheDocument();
    expect(screen.getByText("/ 0")).toBeInTheDocument();
  });
});

const ERROR_MAIN_RGB = "rgb(232, 84, 84)";
const SUCCESS_MAIN_RGB = "rgb(77, 183, 106)";

describe("PulseBandSection attention tone", () => {
  it("tints the need-attention cell with the error tone when any item is critical", () => {
    render(
      <PulseBandSection
        actionItems={[
          makeActionItem(ActionItemSeverity.WARNING, "clz00000000000000000ai01"),
          makeActionItem(ActionItemSeverity.CRITICAL, "clz00000000000000000ai02"),
        ]}
        athletes={[]}
        totalActiveAthletes={1}
      />,
    );

    expect(screen.getByText("2")).toHaveStyle({ color: ERROR_MAIN_RGB });
  });

  it("uses the success tone when there are no action items", () => {
    render(
      <PulseBandSection
        actionItems={[]}
        athletes={[makeAthlete(TodayStatus.COMPLETED, "clz00000000000000000ath1")]}
        totalActiveAthletes={3}
      />,
    );

    expect(screen.getByText("0")).toHaveStyle({ color: SUCCESS_MAIN_RGB });
  });
});
