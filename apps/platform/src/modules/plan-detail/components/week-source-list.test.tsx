import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { PopulatedWeek } from "@repo/contracts/lms/week";

import { render } from "@app/test/render";

import { WeekSourceList } from "./week-source-list";

const EMPTY_MESSAGE = "No other weeks with content yet — build a week first, then clone it.";
const PREVIOUS_WEEK_HINT = "Previous week";

const WEEK_A = "2026-01-05";
const WEEK_B = "2025-12-29";

const makeWeek = (overrides: Partial<PopulatedWeek> = {}): PopulatedWeek => ({
  startDate: WEEK_A,
  sessionCount: 5,
  dayCount: 4,
  ...overrides,
});

describe("WeekSourceList loading state", () => {
  it("renders skeleton rows and no pickable week rows while loading", () => {
    const { container } = render(<WeekSourceList weeks={[]} isLoading onPick={vi.fn()} />);

    expect(container.querySelectorAll(".MuiSkeleton-root").length).toBeGreaterThan(0);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.queryByText(EMPTY_MESSAGE)).toBeNull();
  });
});

describe("WeekSourceList empty state", () => {
  it("renders the empty-state message when there are no weeks and not loading", () => {
    render(<WeekSourceList weeks={[]} isLoading={false} onPick={vi.fn()} />);

    expect(screen.getByText(EMPTY_MESSAGE)).toBeInTheDocument();
  });
});

describe("WeekSourceList loaded state", () => {
  it("renders one pickable row per week with the session/day summary", () => {
    const weeks = [
      makeWeek({ startDate: WEEK_A, sessionCount: 5, dayCount: 4 }),
      makeWeek({ startDate: WEEK_B, sessionCount: 2, dayCount: 1 }),
    ];

    render(<WeekSourceList weeks={weeks} isLoading={false} onPick={vi.fn()} />);

    const rows = screen.getAllByRole("button");

    expect(rows).toHaveLength(2);
    expect(screen.getByText("5 sessions · 4 days")).toBeInTheDocument();
    expect(screen.getByText("2 sessions · 1 days")).toBeInTheDocument();
    expect(screen.getAllByText(/^Week of /)).toHaveLength(2);
  });

  it("renders the Previous week chip only on the first row", () => {
    const weeks = [
      makeWeek({ startDate: WEEK_A }),
      makeWeek({ startDate: WEEK_B, sessionCount: 2, dayCount: 1 }),
    ];

    render(<WeekSourceList weeks={weeks} isLoading={false} onPick={vi.fn()} />);

    expect(screen.getAllByText(PREVIOUS_WEEK_HINT)).toHaveLength(1);
  });

  it("fires onPick with the row's startDate when a week is clicked", () => {
    const onPick = vi.fn();
    const weeks = [
      makeWeek({ startDate: WEEK_A }),
      makeWeek({ startDate: WEEK_B, sessionCount: 2, dayCount: 1 }),
    ];

    render(<WeekSourceList weeks={weeks} isLoading={false} onPick={onPick} />);

    fireEvent.click(screen.getAllByRole("button")[1] as HTMLElement);

    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith(WEEK_B);
  });
});
