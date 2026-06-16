import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import { ActionItemSeverity, ActionItemType } from "@repo/contracts/coaching/coach-action-item";
import type { CoachAthleteDetail, Last7Day } from "@repo/contracts/coaching/coach-athletes";
import { ProcessStatus, TodayStatus } from "@repo/contracts/coaching/coach-dashboard";
import { EnrollmentStatus } from "@repo/contracts/lms";

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
  useCreateCoachNote: () => ({ mutate: vi.fn(), isPending: false }),
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
  healthNote: null,
  gender: null,
  heightCm: null,
  weightKg: null,
  processStatus: ProcessStatus.ON_TRACK,
  enrollments: [
    {
      planId: PLAN_ID,
      planName: "Strength Block",
      status: EnrollmentStatus.ACTIVE,
      boardedAt: NOW,
    },
  ],
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
  notes: [],
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

const renderDrawer = (athleteId: string | null) =>
  render(
    <AthleteDetailDrawer
      athleteId={athleteId}
      visibleIds={[ATHLETE_ID]}
      onClose={vi.fn()}
      onNavigate={vi.fn()}
    />,
  );

beforeEach(() => {
  detailState.data = makeDetail();
  detailState.isLoading = false;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AthleteDetailDrawer shell", () => {
  it("renders the athlete identity and the four tabs when open", () => {
    renderDrawer(ATHLETE_ID);

    expect(screen.getByText("aria@example.com")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Today" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Plan" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Notes" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Health" })).toBeInTheDocument();
  });

  it("leads the head with the prominent display name and keeps the email secondary", () => {
    renderDrawer(ATHLETE_ID);

    const names = screen.getAllByText("Aria Stone");
    const email = screen.getByText("aria@example.com");

    expect(names.length).toBeGreaterThan(0);
    expect(names.some((node) => node.tagName === "H5")).toBe(true);
    expect(email).toBeInTheDocument();
  });

  it("pins the open action items block above the tab content", () => {
    renderDrawer(ATHLETE_ID);

    expect(screen.getByText("Open action items")).toBeInTheDocument();
    expect(screen.getByText("3 consecutive days missed")).toBeInTheDocument();
  });

  it("defaults to the Today pane showing the workout and week of cycle", () => {
    renderDrawer(ATHLETE_ID);

    expect(screen.getByText("Back Squat 5x5")).toBeInTheDocument();
    expect(screen.getByText("Week 3 / 8")).toBeInTheDocument();
  });

  it("badges the Notes tab with the embedded note count", () => {
    detailState.data = makeDetail({
      notes: [{ id: "clz00000000000000000not1", content: "Watch the knee", createdAt: NOW }],
    });

    renderDrawer(ATHLETE_ID);

    expect(screen.getByRole("tab", { name: "Notes · 1" })).toBeInTheDocument();
  });
});

describe("AthleteDetailDrawer navigation", () => {
  it("disables prev/next when the athlete is the only visible row", () => {
    renderDrawer(ATHLETE_ID);

    expect(screen.getByRole("button", { name: "Previous athlete" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next athlete" })).toBeDisabled();
  });

  it("shows the position counter", () => {
    renderDrawer(ATHLETE_ID);

    expect(screen.getByText(/of 1/)).toBeInTheDocument();
  });
});

describe("AthleteDetailDrawer tab switching", () => {
  it("shows the notes pane after switching to the Notes tab", () => {
    renderDrawer(ATHLETE_ID);

    fireEvent.click(screen.getByRole("tab", { name: "Notes" }));

    expect(screen.getByText("No notes yet.")).toBeInTheDocument();
  });

  it("shows the health pane after switching to the Health tab", () => {
    renderDrawer(ATHLETE_ID);

    fireEvent.click(screen.getByRole("tab", { name: "Health" }));

    expect(screen.getByText("Health status")).toBeInTheDocument();
  });

  it("shows the plan pane with the deep-link affordance after switching to Plan", () => {
    renderDrawer(ATHLETE_ID);

    fireEvent.click(screen.getByRole("tab", { name: "Plan" }));

    expect(screen.getByText("Open in Plan Editor")).toBeInTheDocument();
  });
});

describe("AthleteDetailDrawer footer", () => {
  it("links Message to a mailto and Open plan to the plan editor", () => {
    renderDrawer(ATHLETE_ID);

    expect(screen.getByRole("link", { name: /Message/ })).toHaveAttribute(
      "href",
      `mailto:${encodeURIComponent("aria@example.com")}`,
    );
    expect(screen.getByRole("link", { name: /Open plan/ })).toHaveAttribute(
      "href",
      `/coach/plans/${PLAN_ID}`,
    );
  });

  it("encodes the athlete email into the Message mailto so headers cannot be injected", () => {
    detailState.data = makeDetail({ email: "a@b.com?subject=PWNED&cc=victim@x.com" });

    renderDrawer(ATHLETE_ID);

    const href = screen.getByRole("link", { name: /Message/ }).getAttribute("href");

    expect(href).toBe(`mailto:${encodeURIComponent("a@b.com?subject=PWNED&cc=victim@x.com")}`);
    expect(href).not.toContain("?subject=");
    expect(href).not.toContain("&cc=");
  });

  it("does not render the tabs when no athlete is selected", () => {
    renderDrawer(null);

    expect(screen.queryByRole("tab", { name: "Today" })).toBeNull();
  });
});
