import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ActionItemSeverity, ActionItemType } from "@repo/contracts/coaching/coach-action-item";
import type { DashboardActionItem } from "@repo/contracts/coaching/coach-dashboard";

import { render } from "@app/test/render";

import { NeedsAttentionSection } from "./needs-attention-section";

const NOW = new Date("2026-06-16T09:00:00.000Z");

const makeItem = (overrides: Partial<DashboardActionItem> = {}): DashboardActionItem => ({
  id: "clz00000000000000000ai01",
  type: ActionItemType.MISSED_WORKOUTS,
  severity: ActionItemSeverity.WARNING,
  athleteId: "clz00000000000000000ath1",
  athleteName: "Aria Stone",
  athleteImage: null,
  message: "3 consecutive days missed",
  createdAt: NOW,
  ...overrides,
});

const renderSection = (items: DashboardActionItem[]) => {
  const onOpenAthlete = vi.fn();
  const onOpenResolve = vi.fn();
  const onQuickResolve = vi.fn();

  render(
    <NeedsAttentionSection
      items={items}
      onOpenAthlete={onOpenAthlete}
      onOpenResolve={onOpenResolve}
      onQuickResolve={onQuickResolve}
    />,
  );

  return { onOpenAthlete, onOpenResolve, onQuickResolve };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("NeedsAttentionSection rendering", () => {
  it("renders the action items in the order supplied (server pre-sorted)", () => {
    renderSection([
      makeItem({
        id: "clz00000000000000000ai01",
        severity: ActionItemSeverity.CRITICAL,
        message: "critical first",
      }),
      makeItem({
        id: "clz00000000000000000ai02",
        severity: ActionItemSeverity.WARNING,
        message: "warning second",
      }),
    ]);

    const messages = screen.getAllByText(/first|second/).map((node) => node.textContent);

    expect(messages).toEqual(["critical first", "warning second"]);
  });

  it("renders the empty roster-clean copy when there are no items", () => {
    renderSection([]);

    expect(screen.getByText("No open action items. The roster is clean.")).toBeInTheDocument();
  });

  it("shows the section count in the head", () => {
    renderSection([
      makeItem({ id: "clz00000000000000000ai01" }),
      makeItem({ id: "clz00000000000000000ai02" }),
    ]);

    expect(screen.getByText("Needs attention")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});

describe("NeedsAttentionCard interactions", () => {
  it("quick-resolves with the item id when Contacted is clicked", () => {
    const { onQuickResolve, onOpenResolve } = renderSection([
      makeItem({ id: "clz00000000000000000ai01" }),
    ]);

    fireEvent.click(screen.getByRole("button", { name: "Contacted" }));

    expect(onQuickResolve).toHaveBeenCalledTimes(1);
    expect(onQuickResolve).toHaveBeenCalledWith("clz00000000000000000ai01");
    expect(onOpenResolve).not.toHaveBeenCalled();
  });

  it("opens the athlete drawer when the chevron is clicked", () => {
    const { onOpenAthlete, onOpenResolve } = renderSection([
      makeItem({ id: "clz00000000000000000ai01", athleteId: "clz00000000000000000ath9" }),
    ]);

    fireEvent.click(screen.getByRole("button", { name: "Open athlete" }));

    expect(onOpenAthlete).toHaveBeenCalledTimes(1);
    expect(onOpenAthlete).toHaveBeenCalledWith("clz00000000000000000ath9");
    expect(onOpenResolve).not.toHaveBeenCalled();
  });

  it("opens the resolve modal when the card body is clicked", () => {
    const item = makeItem({ id: "clz00000000000000000ai01" });
    const { onOpenResolve, onQuickResolve, onOpenAthlete } = renderSection([item]);

    fireEvent.click(screen.getByText("3 consecutive days missed"));

    expect(onOpenResolve).toHaveBeenCalledTimes(1);
    expect(onOpenResolve).toHaveBeenCalledWith(item);
    expect(onQuickResolve).not.toHaveBeenCalled();
    expect(onOpenAthlete).not.toHaveBeenCalled();
  });

  it("renders the createdAt as relative time-ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW.getTime() + 3 * 60 * 60 * 1000));

    renderSection([makeItem({ id: "clz00000000000000000ai01", createdAt: NOW })]);

    expect(screen.getByText("3h ago")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("derives a health chip from a health-report message", () => {
    renderSection([
      makeItem({
        id: "clz00000000000000000ai01",
        type: ActionItemType.HEALTH_REPORT,
        message: "Athlete reported INJURED status",
      }),
    ]);

    expect(screen.getByText("Injured")).toBeInTheDocument();
  });
});
