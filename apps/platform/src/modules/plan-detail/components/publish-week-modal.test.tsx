import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GeneralMobileLink } from "@repo/contracts/coaching/mobile-link";
import { MOBILE_RECONNECT_REQUIRED } from "@repo/contracts/coaching/mobile-publish";
import type {
  PublishMobileData,
  PublishMobileResult,
} from "@repo/contracts/coaching/mobile-publish";

import {
  makeMobileLink,
  makePublishDayResult,
  publishResultsAllActions,
} from "@app/lib/mobile.fixtures";
import { render } from "@app/test/render";

import { PublishResultsPanel, type PublishLevelGroup } from "./publish-results-panel";

type PublishVars = PublishMobileData;
type Deferred = {
  promise: Promise<PublishMobileResult>;
  resolve: (value: PublishMobileResult) => void;
};

const mutateAsyncMock = vi.fn<(vars: PublishVars) => Promise<PublishMobileResult>>();
const connectModalSpy = vi.fn<(props: { open: boolean }) => void>();

vi.mock("@app/lib/hooks", () => ({
  usePublishMobile: () => ({ mutateAsync: mutateAsyncMock }),
}));

vi.mock("../../coach-profile/components", () => ({
  ConnectMobileModal: ({
    open,
    onConnected,
  }: {
    open: boolean;
    onConnected?: () => void;
    onClose: () => void;
    title?: string;
  }) => {
    connectModalSpy({ open });

    if (!open) {
      return null;
    }

    return (
      <button type="button" data-testid="stub-reconnect" onClick={() => onConnected?.()}>
        stub-reconnect
      </button>
    );
  },
}));

const { PublishWeekModal } = await import("./publish-week-modal");

const MONDAY = new Date("2026-01-05T00:00:00.000Z");
const START_DATE = "2026-01-05";
const CONFLICT_DATE = "2026-01-06";
const LINK_A: GeneralMobileLink = makeMobileLink({
  id: "cklinkaaaaaaaaaaaaaaaaaaaa",
  legacyLevelId: 2,
});
const LINK_B: GeneralMobileLink = makeMobileLink({
  id: "cklinkbbbbbbbbbbbbbbbbbbbb",
  legacyLevelId: 3,
});
const LEVEL_NAMES = new Map<number, string>([
  [2, "Pro"],
  [3, "RX"],
]);
const EMPTY_ATHLETE_NAMES = new Map<string, string>();
const CONFIRM_LABEL = "Overwrite & publish";

const createDeferred = (): Deferred => {
  let resolve!: (value: PublishMobileResult) => void;
  const promise = new Promise<PublishMobileResult>((res) => {
    resolve = res;
  });

  return { promise, resolve };
};

const conflictResult = (): PublishMobileResult => ({
  results: [
    makePublishDayResult({ scheduledDate: START_DATE, action: "created" }),
    makePublishDayResult({ scheduledDate: CONFLICT_DATE, action: "conflict", legacyRowId: null }),
  ],
});

const reconnectError = (): Error => {
  const error = new Error("Session expired");

  Object.assign(error, { details: { reason: MOBILE_RECONNECT_REQUIRED } });

  return error;
};

const renderModal = (links: GeneralMobileLink[] = [LINK_A]) =>
  render(
    <PublishWeekModal
      open
      onClose={onCloseMock}
      monday={MONDAY}
      links={links}
      levelNameById={LEVEL_NAMES}
      athleteNameById={EMPTY_ATHLETE_NAMES}
    />,
  );

const onCloseMock = vi.fn();

beforeEach(() => {
  mutateAsyncMock.mockReset();
  connectModalSpy.mockReset();
  onCloseMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("PublishResultsPanel (MT-1, MT-13)", () => {
  it("renders one StatusChip per day with the right label and weekday (all 5 actions)", () => {
    const groups: PublishLevelGroup[] = [
      {
        linkId: LINK_A.id,
        heading: "Pro",
        outcome: { kind: "results", results: publishResultsAllActions },
      },
    ];

    render(<PublishResultsPanel groups={groups} />);

    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Created")).toBeInTheDocument();
    expect(screen.getByText("Updated")).toBeInTheDocument();
    expect(screen.getByText("Skipped")).toBeInTheDocument();
    expect(screen.getByText("Conflict")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();

    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Tue")).toBeInTheDocument();
    expect(screen.getByText("Wed")).toBeInTheDocument();
    expect(screen.getByText("Thu")).toBeInTheDocument();
    expect(screen.getByText("Fri")).toBeInTheDocument();
  });

  it("renders both rows when two groups share an empty/duplicate heading but differ by linkId (QA-032)", () => {
    const groups: PublishLevelGroup[] = [
      {
        linkId: LINK_A.id,
        heading: "",
        outcome: { kind: "results", results: [makePublishDayResult({ action: "created" })] },
      },
      {
        linkId: LINK_B.id,
        heading: "",
        outcome: { kind: "results", results: [makePublishDayResult({ action: "updated" })] },
      },
    ];

    render(<PublishResultsPanel groups={groups} />);

    expect(screen.getByText("Created")).toBeInTheDocument();
    expect(screen.getByText("Updated")).toBeInTheDocument();
  });
});

describe("PublishWeekModal conflict → overwrite flow", () => {
  it("MT-2: confirming a conflict re-publishes with overwriteUnowned:true, same linkId/startDate/scope", async () => {
    mutateAsyncMock.mockResolvedValueOnce(conflictResult());
    mutateAsyncMock.mockResolvedValueOnce({
      results: [makePublishDayResult({ action: "updated" })],
    });

    renderModal();

    const dialog = await screen.findByRole("dialog", { name: /Overwrite existing days\?/ });

    expect(within(dialog).getByText(/1 day already have content/)).toBeInTheDocument();
    expect(within(dialog).getByText("Tuesday")).toBeInTheDocument();
    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
    expect(mutateAsyncMock.mock.calls[0]?.[0]).toEqual({
      linkId: LINK_A.id,
      startDate: START_DATE,
      scope: "week",
      overwriteUnowned: false,
    });

    await act(async () => {
      fireEvent.click(within(dialog).getByRole("button", { name: CONFIRM_LABEL }));
    });

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(2));
    expect(mutateAsyncMock.mock.calls[1]?.[0]).toEqual({
      linkId: LINK_A.id,
      startDate: START_DATE,
      scope: "week",
      overwriteUnowned: true,
    });
  });

  it("MT-3: cancelling a conflict performs NO second publish and keeps the conflict chips", async () => {
    mutateAsyncMock.mockResolvedValueOnce(conflictResult());

    renderModal();

    const dialog = await screen.findByRole("dialog", { name: /Overwrite existing days\?/ });

    await act(async () => {
      fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    });

    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: /Overwrite existing days\?/ })).toBeNull(),
    );

    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Conflict")).toBeInTheDocument();
  });

  it("MT-4: a double-click on Overwrite & publish fires exactly ONE overwrite run (sync lock)", async () => {
    mutateAsyncMock.mockResolvedValueOnce(conflictResult());

    const overwriteDeferred = createDeferred();

    mutateAsyncMock.mockReturnValueOnce(overwriteDeferred.promise);

    renderModal();

    const dialog = await screen.findByRole("dialog", { name: /Overwrite existing days\?/ });
    const confirmButton = within(dialog).getByRole("button", { name: CONFIRM_LABEL });

    act(() => {
      fireEvent.click(confirmButton);
      fireEvent.click(confirmButton);
    });

    expect(mutateAsyncMock).toHaveBeenCalledTimes(2);
    expect(mutateAsyncMock.mock.calls[1]?.[0]?.overwriteUnowned).toBe(true);

    await act(async () => {
      overwriteDeferred.resolve({ results: [makePublishDayResult({ action: "updated" })] });
      await overwriteDeferred.promise;
    });

    expect(mutateAsyncMock).toHaveBeenCalledTimes(2);
  });
});

describe("PublishWeekModal in-flight publish re-entrancy (MT-5, QA-001/QA-003)", () => {
  const baseProps = {
    onClose: onCloseMock,
    monday: MONDAY,
    links: [LINK_A],
    levelNameById: LEVEL_NAMES,
    athleteNameById: EMPTY_ATHLETE_NAMES,
  };

  it("does not fire a second concurrent publish when the open modal re-renders mid-flight", async () => {
    const firstRun = createDeferred();

    mutateAsyncMock.mockReturnValue(firstRun.promise);

    const { rerender } = render(<PublishWeekModal open {...baseProps} />);

    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);

    rerender(<PublishWeekModal open {...baseProps} />);
    rerender(<PublishWeekModal open {...baseProps} />);

    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      firstRun.resolve({ results: [makePublishDayResult({ action: "created" })] });
      await firstRun.promise;
    });

    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Created")).toBeInTheDocument();
  });

  it("arms a fresh publish exactly once per mount", async () => {
    mutateAsyncMock.mockResolvedValue({ results: [makePublishDayResult({ action: "created" })] });

    const first = render(<PublishWeekModal open {...baseProps} />);

    expect(await screen.findByText("Created")).toBeInTheDocument();
    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);

    first.unmount();

    render(<PublishWeekModal open {...baseProps} />);

    expect(await screen.findByText("Created")).toBeInTheDocument();
    expect(mutateAsyncMock).toHaveBeenCalledTimes(2);
  });
});

describe("PublishWeekModal reconnect during overwrite (MT-6, QA-006)", () => {
  it("re-runs after a reconnect WITHOUT overwriteUnowned so conflicts re-prompt", async () => {
    mutateAsyncMock.mockResolvedValueOnce(conflictResult());
    mutateAsyncMock.mockRejectedValueOnce(reconnectError());
    mutateAsyncMock.mockResolvedValueOnce(conflictResult());

    renderModal();

    const confirmDialog = await screen.findByRole("dialog", { name: /Overwrite existing days\?/ });

    await act(async () => {
      fireEvent.click(within(confirmDialog).getByRole("button", { name: CONFIRM_LABEL }));
    });

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(2));
    expect(mutateAsyncMock.mock.calls[1]?.[0]?.overwriteUnowned).toBe(true);

    const reconnectButton = await screen.findByRole("button", { name: "Reconnect" });

    await act(async () => {
      fireEvent.click(reconnectButton);
    });

    const reconnectStub = await screen.findByTestId("stub-reconnect");

    await act(async () => {
      fireEvent.click(reconnectStub);
    });

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(3));
    expect(mutateAsyncMock.mock.calls[2]?.[0]?.overwriteUnowned).toBe(false);
  });
});

describe("PublishWeekModal multi-link partial failure (MT-7)", () => {
  it("renders link A's chips and link B's reconnect CTA, counting only A's conflict", async () => {
    mutateAsyncMock.mockImplementation(async (vars) => {
      if (vars.linkId === LINK_A.id) {
        return conflictResult();
      }

      throw reconnectError();
    });

    renderModal([LINK_A, LINK_B]);

    const confirmDialog = await screen.findByRole("dialog", { name: /Overwrite existing days\?/ });

    expect(within(confirmDialog).getByText(/1 day already have content/)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(within(confirmDialog).getByRole("button", { name: "Cancel" }));
    });

    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: /Overwrite existing days\?/ })).toBeNull(),
    );

    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("RX")).toBeInTheDocument();
    expect(screen.getByText("Conflict")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reconnect" })).toBeInTheDocument();

    expect(mutateAsyncMock).toHaveBeenCalledTimes(2);
  });
});

describe("PublishWeekModal mounted-closed stability (regression: max update depth)", () => {
  it("does not loop or publish when closed while the parent re-renders with fresh prop references", () => {
    const freshProps = () => ({
      open: false,
      onClose: onCloseMock,
      monday: new Date("2026-01-05T00:00:00.000Z"),
      links: [makeMobileLink({ id: LINK_A.id, legacyLevelId: 2 })],
      levelNameById: new Map<number, string>([[2, "Pro"]]),
      athleteNameById: EMPTY_ATHLETE_NAMES,
    });

    const { rerender } = render(<PublishWeekModal {...freshProps()} />);

    for (let index = 0; index < 6; index += 1) {
      rerender(<PublishWeekModal {...freshProps()} />);
    }

    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });
});
