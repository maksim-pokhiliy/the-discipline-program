import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ActionItemSeverity, ActionItemType } from "@repo/contracts/coaching/coach-action-item";
import type { DashboardActionItem } from "@repo/contracts/coaching/coach-dashboard";

import { render } from "@app/test/render";

const NOW = new Date("2026-06-16T09:00:00.000Z");

const resolveMutate = vi.fn();

vi.mock("@app/lib/hooks", () => ({
  useResolveActionItem: () => ({ mutate: resolveMutate, isPending: false }),
}));

const { ResolveActionItemModal } = await import("./resolve-action-item-modal");

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

beforeEach(() => {
  resolveMutate.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ResolveActionItemModal rendering", () => {
  it("renders nothing when no item is supplied", () => {
    const { container } = render(<ResolveActionItemModal open onClose={vi.fn()} item={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the action-item message and reason options", () => {
    render(<ResolveActionItemModal open onClose={vi.fn()} item={makeItem()} />);

    expect(screen.getByText("3 consecutive days missed")).toBeInTheDocument();
    expect(screen.getByText("I contacted the athlete")).toBeInTheDocument();
    expect(screen.getByText("Condition cleared")).toBeInTheDocument();
    expect(screen.getByText("Assignment ended")).toBeInTheDocument();
  });

  it("renders the athlete context line with name, type and time-ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW.getTime() + 5 * 60_000));

    render(
      <ResolveActionItemModal
        open
        onClose={vi.fn()}
        item={makeItem({ athleteName: "Aria Stone" })}
      />,
    );

    expect(screen.getByText("Aria Stone")).toBeInTheDocument();
    expect(screen.getByText("Missed")).toBeInTheDocument();
    expect(screen.getByText("5m ago")).toBeInTheDocument();

    vi.useRealTimers();
  });
});

describe("ResolveActionItemModal reason lock", () => {
  it("disables the auto reasons and marks them with an Auto badge", () => {
    render(<ResolveActionItemModal open onClose={vi.fn()} item={makeItem()} />);

    const manual = screen.getByText("I contacted the athlete").closest("button");
    const conditionCleared = screen.getByText("Condition cleared").closest("button");
    const assignmentEnded = screen.getByText("Assignment ended").closest("button");

    expect(manual).not.toBeDisabled();
    expect(conditionCleared).toBeDisabled();
    expect(assignmentEnded).toBeDisabled();
    expect(screen.getAllByText("Auto")).toHaveLength(2);
  });
});

describe("ResolveActionItemModal submit", () => {
  it("resolves with the item id and athlete id when submitted without a note", () => {
    render(<ResolveActionItemModal open onClose={vi.fn()} item={makeItem()} />);

    fireEvent.click(screen.getByRole("button", { name: "Resolve" }));

    expect(resolveMutate).toHaveBeenCalledTimes(1);
    expect(resolveMutate.mock.calls[0]?.[0]).toEqual({
      itemId: "clz00000000000000000ai01",
      athleteId: "clz00000000000000000ath1",
    });
  });

  it("includes the trimmed note in the resolve payload", () => {
    render(<ResolveActionItemModal open onClose={vi.fn()} item={makeItem()} />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "  called and left a voicemail  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Resolve" }));

    expect(resolveMutate.mock.calls[0]?.[0]).toEqual({
      itemId: "clz00000000000000000ai01",
      athleteId: "clz00000000000000000ath1",
      note: "called and left a voicemail",
    });
  });

  it("closes via the success callback after a resolve", () => {
    const onClose = vi.fn();

    resolveMutate.mockImplementation((_vars: unknown, opts: { onSuccess: () => void }) =>
      opts.onSuccess(),
    );

    render(<ResolveActionItemModal open onClose={onClose} item={makeItem()} />);

    fireEvent.click(screen.getByRole("button", { name: "Resolve" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
