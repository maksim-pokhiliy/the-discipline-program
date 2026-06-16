import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Gender, HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import type { CoachAthleteDetail } from "@repo/contracts/coaching/coach-athletes";
import { ProcessStatus, TodayStatus } from "@repo/contracts/coaching/coach-dashboard";

import { render } from "@app/test/render";

import { HealthPane } from "./health-pane";

const ATHLETE_ID = "clz00000000000000000ath1";
const NOW = new Date("2026-06-16T09:00:00.000Z");

const makeDetail = (overrides: Partial<CoachAthleteDetail> = {}): CoachAthleteDetail => ({
  userId: ATHLETE_ID,
  name: "Aria Stone",
  email: "aria@example.com",
  image: null,
  healthStatus: HealthStatus.INJURED,
  healthNote: "Tweaked shoulder, no overhead this week",
  gender: Gender.MALE,
  heightCm: 182,
  weightKg: 84,
  processStatus: ProcessStatus.ON_TRACK,
  enrollments: [],
  planDiscipline: [],
  recentWorkouts: [],
  actionItems: [],
  notes: [],
  nextWorkout: null,
  consistency: { adherenceRate4w: 0.7, currentStreak: 0, missedThisWeek: 0 },
  enrolledSince: NOW,
  lastActivityDate: null,
  daysSinceLastActivity: null,
  last7Days: [],
  currentWeek: null,
  totalWeeks: 0,
  todayStatus: TodayStatus.NO_SCHEDULE,
  todayWorkoutTitle: null,
  ...overrides,
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("HealthPane populated profile", () => {
  it("renders the metric values and health status", () => {
    render(<HealthPane detail={makeDetail()} />);

    expect(screen.getByText("Male")).toBeInTheDocument();
    expect(screen.getByText("182")).toBeInTheDocument();
    expect(screen.getByText("84")).toBeInTheDocument();
    expect(screen.getByText("Injured")).toBeInTheDocument();
  });

  it("renders the coach health note when present", () => {
    render(<HealthPane detail={makeDetail()} />);

    expect(screen.getByText("Tweaked shoulder, no overhead this week")).toBeInTheDocument();
  });
});

describe("HealthPane synthesized default", () => {
  it("renders dashes for unknown metrics and a healthy status", () => {
    render(
      <HealthPane
        detail={makeDetail({
          gender: null,
          heightCm: null,
          weightKg: null,
          healthStatus: HealthStatus.HEALTHY,
          healthNote: null,
        })}
      />,
    );

    expect(screen.getAllByText("—")).toHaveLength(3);
    expect(screen.getByText("Healthy")).toBeInTheDocument();
  });

  it("omits the health-note block when there is no note", () => {
    render(
      <HealthPane detail={makeDetail({ healthStatus: HealthStatus.HEALTHY, healthNote: null })} />,
    );

    expect(screen.queryByText("Coach's note")).toBeNull();
  });
});
