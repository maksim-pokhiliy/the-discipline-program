import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import { ActionItemSeverity, ActionItemType } from "@repo/contracts/coaching/coach-action-item";
import {
  type AthleteDailySummary,
  type CoachDashboardData,
  type DashboardActionItem,
  TodayStatus,
} from "@repo/contracts/coaching/coach-dashboard";

import { render } from "@app/test/render";

const VALID_CUID = "clz00000000000000000fake1";
const NOW = new Date("2026-06-16T09:00:00.000Z");

const dashboardState = {
  data: undefined as CoachDashboardData | undefined,
  isLoading: false,
  error: null as Error | null,
};
const resolveMutate = vi.fn();
const sessionName = { value: "Denys" as string | null };

vi.mock("@app/lib/hooks", () => ({
  useCoachDashboard: () => ({
    data: dashboardState.data,
    isLoading: dashboardState.isLoading,
    error: dashboardState.error,
  }),
  useResolveActionItem: () => ({ mutate: resolveMutate, isPending: false }),
  useCoachAthleteDetail: () => ({ data: undefined, isLoading: false }),
  useCreateCoachNote: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@repo/auth/client", () => ({
  useSession: () => ({ data: { user: { name: sessionName.value } } }),
}));

const { DashboardView } = await import("./dashboard-view");

const makeOverview = (
  overrides: Partial<CoachDashboardData["overview"]> = {},
): CoachDashboardData["overview"] => ({
  totalActiveAthletes: 4,
  activePlansCount: 2,
  workoutsPlannedToday: 4,
  workoutsCompletedToday: 1,
  workoutsPlannedThisWeek: 20,
  workoutsCompletedThisWeek: 9,
  openActionItemsCount: 1,
  newAthletesCount: 2,
  ...overrides,
});

const makeActionItem = (overrides: Partial<DashboardActionItem> = {}): DashboardActionItem => ({
  id: VALID_CUID,
  type: ActionItemType.MISSED_WORKOUTS,
  severity: ActionItemSeverity.WARNING,
  athleteId: "clz00000000000000000ath1",
  athleteName: "Aria Stone",
  athleteImage: null,
  message: "3 consecutive days missed — reach out",
  createdAt: NOW,
  ...overrides,
});

const makeAthlete = (overrides: Partial<AthleteDailySummary> = {}): AthleteDailySummary => ({
  userId: "clz00000000000000000ath1",
  name: "Aria Stone",
  email: "aria@example.com",
  image: null,
  planId: "clz00000000000000000pln1",
  planName: "Strength Block",
  todayStatus: TodayStatus.MISSED,
  missedCount: 3,
  todayWorkoutTitle: "Back Squat 5x5",
  lastActivityDate: NOW,
  daysSinceLastActivity: 4,
  healthStatus: HealthStatus.HEALTHY,
  ...overrides,
});

const makeDashboard = (overrides: Partial<CoachDashboardData> = {}): CoachDashboardData => ({
  overview: makeOverview(),
  actionItems: [makeActionItem()],
  athletesSummary: [makeAthlete()],
  progressBuckets: {
    onTrack: [],
    steady: [],
    fallingBehind: [],
    avgEngagementRate: 0.5,
    ...overrides.progressBuckets,
  },
  ...overrides,
});

beforeEach(() => {
  dashboardState.data = makeDashboard();
  dashboardState.isLoading = false;
  dashboardState.error = null;
  sessionName.value = "Denys";
  resolveMutate.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DashboardView empty roster", () => {
  it("renders the empty state when there are no active athletes", () => {
    dashboardState.data = makeDashboard({
      overview: makeOverview({ totalActiveAthletes: 0 }),
      actionItems: [],
      athletesSummary: [],
    });

    render(<DashboardView />);

    expect(screen.getByText("No athletes yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Draft a plan/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Invite athletes/ })).toBeInTheDocument();
  });

  it("does not render the Triage Stack sections in the empty state", () => {
    dashboardState.data = makeDashboard({
      overview: makeOverview({ totalActiveAthletes: 0 }),
      actionItems: [],
      athletesSummary: [],
    });

    render(<DashboardView />);

    expect(screen.queryByText("Needs attention")).toBeNull();
    expect(screen.queryByText("Today")).toBeNull();
  });
});

describe("DashboardView populated roster", () => {
  it("renders the Triage Stack sections when athletes are active", () => {
    render(<DashboardView />);

    expect(screen.getByText("Needs attention")).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Active athletes")).toBeInTheDocument();
    expect(screen.getByText(/This week/)).toBeInTheDocument();
  });

  it("greets the coach by their session name in the header band", () => {
    render(<DashboardView />);

    expect(screen.getByText("Coach Denys")).toBeInTheDocument();
  });

  it("falls back to a nameless header when the session has no name", () => {
    sessionName.value = null;

    render(<DashboardView />);

    expect(screen.getByText("Coach")).toBeInTheDocument();
  });
});
