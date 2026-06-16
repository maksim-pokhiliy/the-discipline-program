import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import { type AthleteDailySummary, TodayStatus } from "@repo/contracts/coaching/coach-dashboard";

import { render } from "@app/test/render";

import { TodayRosterSection } from "./today-roster-section";

const NOW = new Date("2026-06-16T09:00:00.000Z");

const makeAthlete = (
  userId: string,
  name: string,
  todayStatus: TodayStatus,
  email: string,
): AthleteDailySummary => ({
  userId,
  name,
  email,
  image: null,
  planId: "clz00000000000000000pln1",
  planName: "Strength Block",
  todayStatus,
  missedCount: 0,
  todayWorkoutTitle: "Back Squat",
  lastActivityDate: NOW,
  daysSinceLastActivity: 2,
  healthStatus: HealthStatus.HEALTHY,
});

const MISSED_A = makeAthlete(
  "clz0000000000000000miss1",
  "Missed Mary",
  TodayStatus.MISSED,
  "mary@example.com",
);
const MISSED_B = makeAthlete(
  "clz0000000000000000miss2",
  "Missed Mike",
  TodayStatus.MISSED,
  "mike@example.com",
);
const PENDING_A = makeAthlete(
  "clz0000000000000000pend1",
  "Pending Pat",
  TodayStatus.PENDING,
  "pat@example.com",
);
const COMPLETED_A = makeAthlete(
  "clz0000000000000000comp1",
  "Done Dana",
  TodayStatus.COMPLETED,
  "dana@example.com",
);

const ROSTER = [MISSED_A, MISSED_B, PENDING_A, COMPLETED_A];

const originalLocation = window.location;

const renderSection = (athletes: AthleteDailySummary[] = ROSTER) => {
  const onOpenAthlete = vi.fn();

  render(<TodayRosterSection athletes={athletes} onOpenAthlete={onOpenAthlete} />);

  return { onOpenAthlete };
};

const switchToTab = (label: string): void => {
  fireEvent.click(screen.getByRole("tab", { name: new RegExp(label) }));
};

const selectAll = (): void => {
  fireEvent.click(screen.getByRole("button", { name: /^Select all/ }));
};

beforeEach(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: { href: "" },
  });
});

afterEach(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: originalLocation,
  });
  vi.restoreAllMocks();
});

describe("TodayRosterSection tab filtering", () => {
  it("defaults to the Missed tab and shows only missed athletes", () => {
    renderSection();

    expect(screen.getByText("Missed Mary")).toBeInTheDocument();
    expect(screen.getByText("Missed Mike")).toBeInTheDocument();
    expect(screen.queryByText("Pending Pat")).toBeNull();
    expect(screen.queryByText("Done Dana")).toBeNull();
  });

  it("switches to the Pending tab and shows only pending athletes", () => {
    renderSection();

    switchToTab("Pending");

    expect(screen.getByText("Pending Pat")).toBeInTheDocument();
    expect(screen.queryByText("Missed Mary")).toBeNull();
  });

  it("switches to the Done tab and shows only completed athletes", () => {
    renderSection();

    switchToTab("Done");

    expect(screen.getByText("Done Dana")).toBeInTheDocument();
    expect(screen.queryByText("Missed Mary")).toBeNull();
  });

  it("shows an empty-bucket message when the active tab has no rows", () => {
    renderSection([MISSED_A]);

    switchToTab("Pending");

    expect(screen.getByText("Nothing in this bucket.")).toBeInTheDocument();
  });

  it("renders each filter tab with its bucket count", () => {
    renderSection();

    expect(screen.getByRole("tab", { name: "Missed 2" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Pending 1" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Done 1" })).toBeInTheDocument();
  });
});

describe("TodayRosterSection multi-select", () => {
  it("persists the selection count across a tab switch", () => {
    renderSection();

    selectAll();

    expect(screen.getByRole("button", { name: "Message 2" })).toBeInTheDocument();

    switchToTab("Pending");

    expect(screen.getByRole("button", { name: "Message 2" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: "Select Pending Pat" }));

    expect(screen.getByRole("button", { name: "Message 3" })).toBeInTheDocument();
  });

  it("builds a mailto with the selected athletes' emails gathered across tabs", () => {
    renderSection();

    selectAll();
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Missed Mike" }));

    switchToTab("Pending");
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Pending Pat" }));

    fireEvent.click(screen.getByRole("button", { name: "Message 2" }));

    expect(window.location.href).toBe("mailto:mary@example.com,pat@example.com");
  });

  it("clears the selection when the batch bar is cancelled", () => {
    renderSection();

    selectAll();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("button", { name: /Message/ })).toBeNull();
  });
});

describe("TodayRosterSection select-all tri-state", () => {
  it("offers Select all when nothing in the bucket is selected", () => {
    renderSection();

    expect(screen.getByRole("button", { name: "Select all 2" })).toBeInTheDocument();
  });

  it("selects every visible row and reflects the full count", () => {
    renderSection();

    selectAll();

    expect(screen.getByRole("button", { name: "Selected 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Message 2" })).toBeInTheDocument();
  });

  it("returns to Select all when a selected row is unchecked into a partial state", () => {
    renderSection();

    selectAll();
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Missed Mary" }));

    expect(screen.getByRole("button", { name: "Select all 2" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Selected 2" })).toBeNull();
  });
});

describe("TodayRosterSection row interaction", () => {
  it("opens the athlete when a row is clicked outside selection mode", () => {
    const { onOpenAthlete } = renderSection();

    fireEvent.click(screen.getByText("Missed Mary"));

    expect(onOpenAthlete).toHaveBeenCalledWith("clz0000000000000000miss1");
  });

  it("toggles selection instead of opening when a row is clicked in selection mode", () => {
    const { onOpenAthlete } = renderSection();

    selectAll();
    onOpenAthlete.mockClear();

    fireEvent.click(screen.getByText("Missed Mary"));

    expect(onOpenAthlete).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Message 1" })).toBeInTheDocument();
  });
});
