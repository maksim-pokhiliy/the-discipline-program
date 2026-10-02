import { QueryClient } from "@tanstack/react-query";
import { act, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  GeneralMobileLink,
  IndividualMobileLink,
  MobileLink,
} from "@repo/contracts/coaching/mobile-link";
import type {
  PublishMobileData,
  PublishMobileResult,
} from "@repo/contracts/coaching/mobile-publish";

import { platformKeys } from "@app/lib/api/keys";
import {
  makeIndividualLink,
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

vi.mock("@app/lib/hooks", () => ({
  usePublishMobile: () => ({ mutateAsync: mutateAsyncMock }),
}));

const { PublishWeekModal } = await import("./publish-week-modal");

const MONDAY = new Date(2026, 0, 5);
const OTHER_MONDAY = new Date(2026, 0, 12);
const PLAN_ID = "ckplan1234567890abcdef0123";
const START_DATE = "2026-01-05";
const OTHER_START_DATE = "2026-01-12";
const SKIPPED_DATE = "2026-01-06";
const PUBLISH_DIALOG_NAME = "Publish week";
const PUBLISH_REQUEST_KEYS = ["linkId", "scope", "startDate"];
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
const INDIVIDUAL_LINK: IndividualMobileLink = makeIndividualLink({
  id: "cklinkindiv0000000000000a1",
  legacyUserId: 101,
});
const ATHLETE_NAMES = new Map<string, string>([[INDIVIDUAL_LINK.athleteId, "Alice Stone"]]);

const createDeferred = (): Deferred => {
  let resolve: (value: PublishMobileResult) => void = () => undefined;
  const promise = new Promise<PublishMobileResult>((res) => {
    resolve = res;
  });

  return { promise, resolve };
};

const skippedResult = (): PublishMobileResult => ({
  results: [
    makePublishDayResult({ scheduledDate: START_DATE, action: "created" }),
    makePublishDayResult({ scheduledDate: SKIPPED_DATE, action: "skipped" }),
  ],
});

const expectOnlyThePublishDialog = (): void => {
  const dialogs = screen.getAllByRole("dialog");

  expect(dialogs).toHaveLength(1);
  expect(screen.getByRole("dialog", { name: PUBLISH_DIALOG_NAME })).toBe(dialogs[0]);
};

const renderModal = (links: GeneralMobileLink[] = [LINK_A]) =>
  render(
    <PublishWeekModal
      open
      onClose={onCloseMock}
      planId={PLAN_ID}
      monday={MONDAY}
      links={links}
      levelNameById={LEVEL_NAMES}
      athleteNameById={EMPTY_ATHLETE_NAMES}
    />,
  );

const onCloseMock = vi.fn();

beforeEach(() => {
  mutateAsyncMock.mockReset();
  onCloseMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("PublishResultsPanel (MT-1, MT-13)", () => {
  it("renders one StatusChip per day with the right label and weekday (all 4 actions)", () => {
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
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.queryByText("Conflict")).toBeNull();

    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Tue")).toBeInTheDocument();
    expect(screen.getByText("Wed")).toBeInTheDocument();
    expect(screen.getByText("Thu")).toBeInTheDocument();
    expect(screen.queryByText("Fri")).toBeNull();
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

describe("PublishWeekModal publish request (no overwrite)", () => {
  it("publishes every link once with only linkId, startDate and scope, never overwriteUnowned", async () => {
    mutateAsyncMock.mockResolvedValue(skippedResult());

    renderModal([LINK_A, LINK_B]);

    expect(await screen.findAllByText("Skipped")).toHaveLength(2);
    expect(mutateAsyncMock).toHaveBeenCalledTimes(2);
    expect(mutateAsyncMock.mock.calls.map(([vars]) => vars)).toEqual([
      { linkId: LINK_A.id, startDate: START_DATE, scope: "week" },
      { linkId: LINK_B.id, startDate: START_DATE, scope: "week" },
    ]);

    for (const [vars] of mutateAsyncMock.mock.calls) {
      expect(Object.keys(vars).sort()).toEqual(PUBLISH_REQUEST_KEYS);
      expect(vars).not.toHaveProperty("overwriteUnowned");
    }
  });

  it("shows no confirmation after a run whose results include every action", async () => {
    mutateAsyncMock.mockResolvedValueOnce({ results: publishResultsAllActions });

    renderModal();

    expect(await screen.findByText("Failed")).toBeInTheDocument();
    expect(screen.getByText("Skipped")).toBeInTheDocument();

    expectOnlyThePublishDialog();
    expect(screen.queryByRole("button", { name: "Overwrite & publish" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Reconnect" })).toBeNull();
    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
  });
});

describe("PublishWeekModal in-flight publish re-entrancy (MT-5, QA-001/QA-003)", () => {
  const baseProps = {
    onClose: onCloseMock,
    planId: PLAN_ID,
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

describe("PublishWeekModal multi-link partial failure (MT-7)", () => {
  it("renders link A's chips and link B's plain error alert when only B's publish rejects", async () => {
    mutateAsyncMock.mockImplementation(async (vars) => {
      if (vars.linkId === LINK_A.id) {
        return skippedResult();
      }

      throw new Error("Session expired");
    });

    renderModal([LINK_A, LINK_B]);

    expect(await screen.findByRole("alert")).toHaveTextContent("Session expired");

    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("RX")).toBeInTheDocument();
    expect(screen.getByText("Created")).toBeInTheDocument();
    expect(screen.getByText("Skipped")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reconnect" })).toBeNull();
    expectOnlyThePublishDialog();

    expect(mutateAsyncMock).toHaveBeenCalledTimes(2);
  });
});

describe("PublishWeekModal mounted-closed stability (regression: max update depth)", () => {
  it("does not loop or publish when closed while the parent re-renders with fresh prop references", () => {
    const freshProps = () => ({
      open: false,
      onClose: onCloseMock,
      planId: PLAN_ID,
      monday: new Date(2026, 0, 5),
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

describe("PublishWeekModal individual + mixed publish headings (QA-14, MT-6)", () => {
  const publishedWeek = (): PublishMobileResult => ({
    results: [makePublishDayResult({ scheduledDate: START_DATE, action: "created" })],
  });

  const renderPublish = (links: MobileLink[], athleteNameById: Map<string, string>) =>
    render(
      <PublishWeekModal
        open
        onClose={onCloseMock}
        planId={PLAN_ID}
        monday={MONDAY}
        links={links}
        levelNameById={LEVEL_NAMES}
        athleteNameById={athleteNameById}
      />,
    );

  it("renders the resolved athlete name as the publish group heading for an individual link (QA-14, MT-6)", async () => {
    mutateAsyncMock.mockResolvedValue(publishedWeek());

    renderPublish([INDIVIDUAL_LINK], ATHLETE_NAMES);

    expect(await screen.findByText("Alice Stone")).toBeInTheDocument();
    expect(screen.queryByText("Level null")).toBeNull();
  });

  it("falls back to the Athlete # heading and never renders Level null/undefined when the athlete name is unresolved (QA-14, MT-6)", async () => {
    mutateAsyncMock.mockResolvedValue(publishedWeek());

    renderPublish([INDIVIDUAL_LINK], EMPTY_ATHLETE_NAMES);

    expect(await screen.findByText("Athlete #101")).toBeInTheDocument();
    expect(screen.queryByText("Level null")).toBeNull();
    expect(screen.queryByText("Level undefined")).toBeNull();
  });

  it("renders a level heading and an athlete heading side by side, each keyed on its linkId, for a mixed run (QA-14, MT-6, QA-032)", async () => {
    mutateAsyncMock.mockResolvedValue(publishedWeek());

    renderPublish([LINK_A, INDIVIDUAL_LINK], ATHLETE_NAMES);

    expect(await screen.findByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Alice Stone")).toBeInTheDocument();
    expect(screen.getAllByText("Created")).toHaveLength(2);
  });
});

describe("PublishWeekModal links-cache refresh (DR-10)", () => {
  const modalWithLinks = (links: MobileLink[]) => (
    <PublishWeekModal
      open
      onClose={onCloseMock}
      planId={PLAN_ID}
      monday={MONDAY}
      links={links}
      levelNameById={LEVEL_NAMES}
      athleteNameById={EMPTY_ATHLETE_NAMES}
    />
  );

  it("refreshes the links query once for the whole fan-out, not once per link", async () => {
    const invalidateSpy = vi.spyOn(QueryClient.prototype, "invalidateQueries");

    mutateAsyncMock.mockResolvedValue({
      results: [makePublishDayResult({ action: "created" })],
    });

    renderModal([LINK_A, LINK_B]);

    expect(await screen.findAllByText("Created")).toHaveLength(2);
    expect(mutateAsyncMock).toHaveBeenCalledTimes(2);
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: platformKeys.mobile.links(PLAN_ID) });
  });

  it("still refreshes the links query when one link's publish rejects mid-batch", async () => {
    const invalidateSpy = vi.spyOn(QueryClient.prototype, "invalidateQueries");

    mutateAsyncMock.mockImplementation(async (vars) => {
      if (vars.linkId === LINK_A.id) {
        throw new Error("legacy 500");
      }

      return { results: [makePublishDayResult({ action: "created" })] };
    });

    renderModal([LINK_A, LINK_B]);

    expect(await screen.findByText("legacy 500")).toBeInTheDocument();
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: platformKeys.mobile.links(PLAN_ID) });
  });

  it("reports the in-flight run against the links it was started with, not a list that changed underneath", async () => {
    const inFlight = createDeferred();

    mutateAsyncMock.mockReturnValueOnce(inFlight.promise);

    const { rerender } = render(modalWithLinks([LINK_A]));

    rerender(modalWithLinks([LINK_B]));

    await act(async () => {
      inFlight.resolve({ results: [makePublishDayResult({ action: "updated" })] });
      await inFlight.promise;
    });

    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
    expect(mutateAsyncMock.mock.calls[0]?.[0]).toEqual({
      linkId: LINK_A.id,
      startDate: START_DATE,
      scope: "week",
    });
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.queryByText("RX")).toBeNull();
    expect(screen.getByText("Updated")).toBeInTheDocument();
  });
});

describe("PublishWeekModal run week snapshot (F2)", () => {
  const modalForWeek = (monday: Date) => (
    <PublishWeekModal
      open
      onClose={onCloseMock}
      planId={PLAN_ID}
      monday={monday}
      links={[LINK_A]}
      levelNameById={LEVEL_NAMES}
      athleteNameById={EMPTY_ATHLETE_NAMES}
    />
  );

  it("publishes the week the run was started for, not the week the coach navigated to mid-flight", async () => {
    const inFlight = createDeferred();

    mutateAsyncMock.mockReturnValueOnce(inFlight.promise);

    const { rerender } = render(modalForWeek(MONDAY));

    rerender(modalForWeek(OTHER_MONDAY));

    await act(async () => {
      inFlight.resolve({ results: [makePublishDayResult({ action: "updated" })] });
      await inFlight.promise;
    });

    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
    expect(mutateAsyncMock.mock.calls[0]?.[0]).toEqual({
      linkId: LINK_A.id,
      startDate: START_DATE,
      scope: "week",
    });
    expect(mutateAsyncMock.mock.calls[0]?.[0]?.startDate).not.toBe(OTHER_START_DATE);
    expect(screen.getByText("Updated")).toBeInTheDocument();
  });

  it("takes the newly opened week once a fresh run starts", async () => {
    mutateAsyncMock.mockResolvedValue({ results: [makePublishDayResult({ action: "created" })] });

    const first = render(modalForWeek(MONDAY));

    expect(await screen.findByText("Created")).toBeInTheDocument();

    first.unmount();

    render(modalForWeek(OTHER_MONDAY));

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(2));
    expect(mutateAsyncMock.mock.calls[1]?.[0]?.startDate).toBe(OTHER_START_DATE);
  });
});

describe("PublishWeekModal settled run snapshot while open (H1)", () => {
  const modalForWeek = (monday: Date, links: MobileLink[] = [LINK_A]) => (
    <PublishWeekModal
      open
      onClose={onCloseMock}
      planId={PLAN_ID}
      monday={monday}
      links={links}
      levelNameById={LEVEL_NAMES}
      athleteNameById={EMPTY_ATHLETE_NAMES}
    />
  );

  it("keeps the opened week's results and does not republish when the coach navigates weeks with the modal open", async () => {
    mutateAsyncMock.mockResolvedValue({ results: [makePublishDayResult({ action: "created" })] });

    const { rerender } = render(modalForWeek(MONDAY));

    expect(await screen.findByText("Created")).toBeInTheDocument();

    await act(async () => {
      rerender(modalForWeek(OTHER_MONDAY));
    });

    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
    expect(mutateAsyncMock.mock.calls[0]?.[0]?.startDate).toBe(START_DATE);
    expect(mutateAsyncMock.mock.calls[0]?.[0]?.startDate).not.toBe(OTHER_START_DATE);
    expect(screen.getByText("Created")).toBeInTheDocument();
  });

  it("keeps the opened links' results and does not republish when the links list changes with the modal open", async () => {
    mutateAsyncMock.mockResolvedValue({ results: [makePublishDayResult({ action: "created" })] });

    const { rerender } = render(modalForWeek(MONDAY, [LINK_A]));

    expect(await screen.findByText("Pro")).toBeInTheDocument();

    await act(async () => {
      rerender(modalForWeek(MONDAY, [LINK_B]));
    });

    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
    expect(mutateAsyncMock.mock.calls[0]?.[0]?.linkId).toBe(LINK_A.id);
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.queryByText("RX")).toBeNull();
  });
});

describe("PublishWeekModal close mid-publish (F3)", () => {
  const modalWithOpen = (open: boolean) => (
    <PublishWeekModal
      open={open}
      onClose={onCloseMock}
      planId={PLAN_ID}
      monday={MONDAY}
      links={[LINK_A]}
      levelNameById={LEVEL_NAMES}
      athleteNameById={EMPTY_ATHLETE_NAMES}
    />
  );

  it("does not start a second batch when the coach closes and reopens while one is still in flight", async () => {
    const inFlight = createDeferred();

    mutateAsyncMock.mockReturnValue(inFlight.promise);

    const { rerender } = render(modalWithOpen(true));

    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);

    rerender(modalWithOpen(false));
    rerender(modalWithOpen(true));
    rerender(modalWithOpen(false));
    rerender(modalWithOpen(true));

    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      inFlight.resolve({ results: [makePublishDayResult({ action: "created" })] });
      await inFlight.promise;
    });

    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
  });

  it("keeps the in-flight batch's results instead of discarding them, so reopening the same week still shows them", async () => {
    const inFlight = createDeferred();

    mutateAsyncMock.mockReturnValueOnce(inFlight.promise);

    const { rerender } = render(modalWithOpen(true));

    rerender(modalWithOpen(false));

    await act(async () => {
      inFlight.resolve(skippedResult());
      await inFlight.promise;
    });

    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);

    rerender(modalWithOpen(true));

    const dialog = await screen.findByRole("dialog", { name: PUBLISH_DIALOG_NAME });

    expect(within(dialog).getByText("Created")).toBeInTheDocument();
    expect(within(dialog).getByText("Skipped")).toBeInTheDocument();
    expectOnlyThePublishDialog();
    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
  });

  it("shows the running state again when the coach reopens mid-batch", async () => {
    const inFlight = createDeferred();

    mutateAsyncMock.mockReturnValueOnce(inFlight.promise);

    const { rerender } = render(modalWithOpen(true));

    rerender(modalWithOpen(false));
    rerender(modalWithOpen(true));

    expect(screen.getByText("Publishing this week…")).toBeInTheDocument();

    await act(async () => {
      inFlight.resolve({ results: [makePublishDayResult({ action: "created" })] });
      await inFlight.promise;
    });

    expect(screen.getByText("Created")).toBeInTheDocument();
    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
  });

  it("still resets and republishes on a close that happens after the batch settled", async () => {
    mutateAsyncMock.mockResolvedValue({ results: [makePublishDayResult({ action: "created" })] });

    const { rerender } = render(modalWithOpen(true));

    expect(await screen.findByText("Created")).toBeInTheDocument();

    rerender(modalWithOpen(false));

    expect(screen.queryByText("Created")).toBeNull();

    rerender(modalWithOpen(true));

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(2));
  });
});

describe("PublishWeekModal reopened on another week after the batch settled (H1)", () => {
  const modalFor = (open: boolean, monday: Date) => (
    <PublishWeekModal
      open={open}
      onClose={onCloseMock}
      planId={PLAN_ID}
      monday={monday}
      links={[LINK_A]}
      levelNameById={LEVEL_NAMES}
      athleteNameById={EMPTY_ATHLETE_NAMES}
    />
  );

  it("publishes the newly opened week instead of replaying the finished week's results", async () => {
    const closedRun = createDeferred();
    const reopenedRun = createDeferred();

    mutateAsyncMock.mockReturnValueOnce(closedRun.promise);
    mutateAsyncMock.mockReturnValueOnce(reopenedRun.promise);

    const { rerender } = render(modalFor(true, MONDAY));

    expect(mutateAsyncMock.mock.calls[0]?.[0]?.startDate).toBe(START_DATE);

    rerender(modalFor(false, MONDAY));

    await act(async () => {
      closedRun.resolve({ results: [makePublishDayResult({ action: "created" })] });
      await closedRun.promise;
    });

    rerender(modalFor(true, OTHER_MONDAY));

    expect(mutateAsyncMock).toHaveBeenCalledTimes(2);
    expect(mutateAsyncMock.mock.calls[1]?.[0]?.startDate).toBe(OTHER_START_DATE);
    expect(screen.queryByText("Created")).toBeNull();
    expect(screen.getByText("Publishing this week…")).toBeInTheDocument();

    await act(async () => {
      reopenedRun.resolve({ results: [makePublishDayResult({ action: "updated" })] });
      await reopenedRun.promise;
    });

    expect(screen.getByText("Updated")).toBeInTheDocument();
  });

  it("clears the finished week's results rather than showing them for the new one", async () => {
    const closedRun = createDeferred();

    mutateAsyncMock.mockReturnValueOnce(closedRun.promise);
    mutateAsyncMock.mockResolvedValueOnce({
      results: [makePublishDayResult({ action: "created" })],
    });

    const { rerender } = render(modalFor(true, MONDAY));

    rerender(modalFor(false, MONDAY));

    await act(async () => {
      closedRun.resolve(skippedResult());
      await closedRun.promise;
    });

    await act(async () => {
      rerender(modalFor(true, OTHER_MONDAY));
    });

    expect(screen.queryByText("Skipped")).toBeNull();
    expectOnlyThePublishDialog();
    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(2));
    expect(mutateAsyncMock.mock.calls[1]?.[0]?.startDate).toBe(OTHER_START_DATE);
  });

  it("still refuses a second concurrent run when the coach reopens on another week mid-batch", () => {
    const inFlight = createDeferred();

    mutateAsyncMock.mockReturnValueOnce(inFlight.promise);

    const { rerender } = render(modalFor(true, MONDAY));

    rerender(modalFor(false, MONDAY));
    rerender(modalFor(true, OTHER_MONDAY));

    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Publishing this week…")).toBeInTheDocument();
  });
});
