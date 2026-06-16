import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DashboardOverview } from "@repo/contracts/coaching/coach-dashboard";

import { render } from "@app/test/render";

import { DashboardFooterLine } from "./dashboard-footer-line";

const makeOverview = (overrides: Partial<DashboardOverview> = {}): DashboardOverview => ({
  totalActiveAthletes: 8,
  activePlansCount: 3,
  workoutsPlannedToday: 8,
  workoutsCompletedToday: 4,
  workoutsPlannedThisWeek: 40,
  workoutsCompletedThisWeek: 22,
  openActionItemsCount: 2,
  newAthletesCount: 3,
  ...overrides,
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DashboardFooterLine", () => {
  it("summarizes this week's sessions, engagement and new athletes", () => {
    render(<DashboardFooterLine overview={makeOverview()} avgEngagementRate={0.55} />);

    expect(screen.getByText("This week")).toBeInTheDocument();
    expect(screen.getByText("22")).toBeInTheDocument();
    expect(screen.getByText(/40 sessions/)).toBeInTheDocument();
    expect(screen.getByText("55%")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(/new athletes/)).toBeInTheDocument();
  });
});
