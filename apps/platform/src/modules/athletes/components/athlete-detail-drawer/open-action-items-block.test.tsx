import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ActionItemSeverity, ActionItemType } from "@repo/contracts/coaching/coach-action-item";
import type { AthleteActionItem } from "@repo/contracts/coaching/coach-athletes";

import { render } from "@app/test/render";

const ATHLETE_ID = "clz00000000000000000ath1";
const NOW = new Date("2026-06-16T09:00:00.000Z");

const resolveMutate = vi.fn();
const resolveState = { isPending: false };

vi.mock("@app/lib/hooks", () => ({
  useResolveActionItem: () => ({ mutate: resolveMutate, isPending: resolveState.isPending }),
}));

const { OpenActionItemsBlock } = await import("./open-action-items-block");

const makeItem = (overrides: Partial<AthleteActionItem> = {}): AthleteActionItem => ({
  id: "clz00000000000000000ai01",
  type: ActionItemType.MISSED_WORKOUTS,
  severity: ActionItemSeverity.WARNING,
  message: "3 consecutive days missed",
  createdAt: NOW,
  ...overrides,
});

beforeEach(() => {
  resolveState.isPending = false;
  resolveMutate.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("OpenActionItemsBlock", () => {
  it("renders nothing when there are no open action items", () => {
    const { container } = render(<OpenActionItemsBlock athleteId={ATHLETE_ID} actionItems={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the open action items with a count", () => {
    render(
      <OpenActionItemsBlock
        athleteId={ATHLETE_ID}
        actionItems={[
          makeItem(),
          makeItem({ id: "clz00000000000000000ai02", message: "Health flag" }),
        ]}
      />,
    );

    expect(screen.getByText("Open action items")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3 consecutive days missed")).toBeInTheDocument();
    expect(screen.getByText("Health flag")).toBeInTheDocument();
  });

  it("resolves the item with its id and the athlete id from the quick action", () => {
    render(<OpenActionItemsBlock athleteId={ATHLETE_ID} actionItems={[makeItem()]} />);

    fireEvent.click(screen.getByRole("button", { name: /Resolve/ }));

    expect(resolveMutate).toHaveBeenCalledTimes(1);
    expect(resolveMutate).toHaveBeenCalledWith({
      itemId: "clz00000000000000000ai01",
      athleteId: ATHLETE_ID,
    });
  });
});
