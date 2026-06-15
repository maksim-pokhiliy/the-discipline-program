import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { type DayOfWeek } from "@repo/contracts/lms/_shared";
import type { DaySlot, SessionWithLabel } from "@repo/contracts/lms/day";

import { render } from "@app/test/render";

import { DaySourceList } from "./day-source-list";

const NOW = new Date("2026-01-06T00:00:00.000Z");
const SOURCE_LABEL = "Week of Jan 5 – Jan 11, 2026";
const EMPTY_TAG = "Empty — nothing to clone";
const BACK_LABEL = "Back to week list";

const makeSession = (id: string): SessionWithLabel => ({
  id,
  dayId: "clp9z8x7w0000abcd1234day1",
  order: 1,
  labelId: null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  label: null,
  blocks: [],
});

const makeDay = (dayOfWeek: DayOfWeek, sessionCount: number): DaySlot => ({
  dayOfWeek,
  label: null,
  notes: null,
  sessions: Array.from({ length: sessionCount }, (_, index) =>
    makeSession(`clp9z8x7w0000abcd12s${dayOfWeek}${index}`),
  ),
});

type RenderOptions = {
  days?: DaySlot[];
  isLoading?: boolean;
  onPick?: (dayOfWeek: DayOfWeek) => void;
  onBack?: () => void;
};

const renderList = ({
  days = [makeDay("MONDAY", 2), makeDay("WEDNESDAY", 1)],
  isLoading = false,
  onPick = vi.fn(),
  onBack = vi.fn(),
}: RenderOptions = {}) =>
  render(
    <DaySourceList
      days={days}
      sourceLabel={SOURCE_LABEL}
      isLoading={isLoading}
      onPick={onPick}
      onBack={onBack}
    />,
  );

const dayButtons = (): HTMLElement[] =>
  screen
    .getAllByRole("button")
    .filter((btn) => btn.classList.contains("MuiButtonBase-root"))
    .filter((btn) => btn.classList.contains("MuiListItemButton-root"));

describe("DaySourceList loading state", () => {
  it("renders skeleton rows and no day rows while loading", () => {
    const { container } = renderList({ isLoading: true });

    expect(container.querySelectorAll(".MuiSkeleton-root").length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".MuiListItemButton-root")).toHaveLength(0);
  });
});

describe("DaySourceList loaded state", () => {
  it("renders one row per day of the week (7 rows)", () => {
    renderList();

    expect(dayButtons()).toHaveLength(7);
  });

  it("disables empty days and tags them as nothing to clone", () => {
    renderList();

    const emptyTags = screen.getAllByText(EMPTY_TAG);

    expect(emptyTags).toHaveLength(5);

    const tuesdayRow = screen.getByText("Tuesday — 0 sessions").closest('[role="button"]');

    expect(tuesdayRow).toHaveClass("Mui-disabled");
  });

  it("keeps populated days enabled", () => {
    renderList();

    const mondayRow = screen.getByText("Monday — 2 sessions").closest('[role="button"]');

    expect(mondayRow).not.toHaveClass("Mui-disabled");
  });

  it("fires onPick with the dayOfWeek when a populated day is clicked", () => {
    const onPick = vi.fn();

    renderList({ onPick });

    fireEvent.click(screen.getByText("Wednesday — 1 sessions"));

    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith("WEDNESDAY");
  });

  it("renders empty days as non-interactive (aria-disabled, removed from tab order)", () => {
    renderList();

    const tuesdayRow = screen.getByText("Tuesday — 0 sessions").closest('[role="button"]');

    if (tuesdayRow === null) {
      throw new Error("expected the Tuesday row button");
    }

    expect(tuesdayRow).toHaveAttribute("aria-disabled", "true");
    expect(tuesdayRow).toHaveAttribute("tabindex", "-1");
  });
});

describe("DaySourceList back control", () => {
  it("fires onBack when the Back control is clicked", () => {
    const onBack = vi.fn();

    renderList({ onBack });

    fireEvent.click(screen.getByRole("button", { name: BACK_LABEL }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
