import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import { ActionItemSeverity, ActionItemType } from "@repo/contracts/coaching/coach-action-item";
import type { CoachAthleteDetail, Last7Day } from "@repo/contracts/coaching/coach-athletes";
import { ProcessStatus, TodayStatus } from "@repo/contracts/coaching/coach-dashboard";

import { render } from "@app/test/render";

const ATHLETE_ID = "clz00000000000000000ath1";
const PLAN_ID = "clz00000000000000000pln1";
const NOW = new Date("2026-06-16T09:00:00.000Z");
const DAY_MS = 24 * 60 * 60 * 1000;

const detailState = {
  data: undefined as CoachAthleteDetail | undefined,
  isLoading: false,
};

vi.mock("@app/lib/hooks", () => ({
  useCoachAthleteDetail: () => ({ data: detailState.data, isLoading: detailState.isLoading }),
  useCoachNotes: () => ({ data: [], isLoading: false }),
  useCreateCoachNote: () => ({ mutate: vi.fn(), isPending: false }),
  useCoachAthleteProfile: () => ({
    data: {
      id: ATHLETE_ID,
      userId: ATHLETE_ID,
      gender: null,
      heightCm: null,
      weightKg: null,
      healthStatus: HealthStatus.HEALTHY,
      healthNote: null,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    },
    isLoading: false,
  }),
  useResolveActionItem: () => ({ mutate: vi.fn(), isPending: false }),
}));

const { AthleteDetailDrawer } = await import("./index");

const makeLast7Days = (): Last7Day[] =>
  Array.from({ length: 7 }, (_, index) => ({
    date: new Date(NOW.getTime() - (6 - index) * DAY_MS),
    status: TodayStatus.COMPLETED,
  }));

const makeDetail = (overrides: Partial<CoachAthleteDetail> = {}): CoachAthleteDetail => ({
  userId: ATHLETE_ID,
  name: "Aria Stone",
  email: "aria@example.com",
  image: null,
  healthStatus: HealthStatus.HEALTHY,
  processStatus: ProcessStatus.ON_TRACK,
  planDiscipline: [
    {
      planId: PLAN_ID,
      planName: "Strength Block",
      enrolledDate: NOW,
      completed: 4,
      available: 5,
      planned: 6,
    },
  ],
  recentWorkouts: [],
  actionItems: [
    {
      id: "clz00000000000000000ai01",
      type: ActionItemType.MISSED_WORKOUTS,
      severity: ActionItemSeverity.WARNING,
      message: "3 consecutive days missed",
      createdAt: NOW,
    },
  ],
  nextWorkout: null,
  consistency: { adherenceRate4w: 0.72, currentStreak: 3, missedThisWeek: 1 },
  enrolledSince: NOW,
  lastActivityDate: NOW,
  daysSinceLastActivity: 2,
  last7Days: makeLast7Days(),
  currentWeek: 3,
  totalWeeks: 8,
  todayStatus: TodayStatus.PENDING,
  todayWorkoutTitle: "Back Squat 5x5",
  ...overrides,
});

beforeEach(() => {
  detailState.data = makeDetail();
  detailState.isLoading = false;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AthleteDetailDrawer shell", () => {
  it("renders the athlete identity and the four tabs when open", () => {
    render(<AthleteDetailDrawer athleteId={ATHLETE_ID} onClose={vi.fn()} />);

    expect(screen.getByText("aria@example.com")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Today" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Plan" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Notes" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Health" })).toBeInTheDocument();
  });

  it("pins the open action items block above the tab content", () => {
    render(<AthleteDetailDrawer athleteId={ATHLETE_ID} onClose={vi.fn()} />);

    expect(screen.getByText("Open action items")).toBeInTheDocument();
    expect(screen.getByText("3 consecutive days missed")).toBeInTheDocument();
  });

  it("defaults to the Today pane showing the workout and week of cycle", () => {
    render(<AthleteDetailDrawer athleteId={ATHLETE_ID} onClose={vi.fn()} />);

    expect(screen.getByText("Back Squat 5x5")).toBeInTheDocument();
    expect(screen.getByText("Week 3 / 8")).toBeInTheDocument();
  });
});

describe("AthleteDetailDrawer tab switching", () => {
  it("shows the notes pane after switching to the Notes tab", () => {
    render(<AthleteDetailDrawer athleteId={ATHLETE_ID} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("tab", { name: "Notes" }));

    expect(screen.getByText("No notes yet.")).toBeInTheDocument();
  });

  it("shows the health pane after switching to the Health tab", () => {
    render(<AthleteDetailDrawer athleteId={ATHLETE_ID} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("tab", { name: "Health" }));

    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Health status")).toBeInTheDocument();
  });

  it("shows the plan pane with the deep-link affordance after switching to Plan", () => {
    render(<AthleteDetailDrawer athleteId={ATHLETE_ID} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("tab", { name: "Plan" }));

    expect(screen.getByText("Open in Plan Editor")).toBeInTheDocument();
  });
});

describe("AthleteDetailDrawer footer", () => {
  it("links Message to a mailto and Open plan to the plan editor", () => {
    render(<AthleteDetailDrawer athleteId={ATHLETE_ID} onClose={vi.fn()} />);

    expect(screen.getByRole("link", { name: /Message/ })).toHaveAttribute(
      "href",
      "mailto:aria@example.com",
    );
    expect(screen.getByRole("link", { name: /Open plan/ })).toHaveAttribute(
      "href",
      `/coach/plans/${PLAN_ID}`,
    );
  });

  it("does not render when no athlete is selected", () => {
    render(<AthleteDetailDrawer athleteId={null} onClose={vi.fn()} />);

    expect(screen.queryByRole("tab", { name: "Today" })).toBeNull();
  });
});
