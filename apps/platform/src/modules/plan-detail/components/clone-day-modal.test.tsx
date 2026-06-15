import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type DayOfWeek } from "@repo/contracts/lms/_shared";
import type { CloneDayResponse, DaySlot, SessionWithLabel } from "@repo/contracts/lms/day";
import type { PopulatedWeek } from "@repo/contracts/lms/week";

import { render } from "@app/test/render";

type CloneOnSuccess = (result: CloneDayResponse) => void;

const NOW = new Date("2026-01-06T00:00:00.000Z");
const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const TARGET_START_DATE = "2026-01-12";
const TARGET_DAY: DayOfWeek = "MONDAY";
const WEEK_1 = "2026-01-05";
const WEEK_2 = "2025-12-29";
const CONFIRM_LABEL = "Replace day";

const listState = {
  data: undefined as { weeks: PopulatedWeek[] } | undefined,
  isLoading: false,
  error: null as Error | null,
};
const weekState = {
  daysByStartDate: new Map<string, DaySlot[]>(),
  isFetching: false,
};
const cloneState = { isPending: false, error: null as Error | null };
const cloneMutate =
  vi.fn<
    (
      vars: { sourceStartDate: string; sourceDayOfWeek: DayOfWeek },
      opts: { onSuccess: CloneOnSuccess },
    ) => void
  >();
const refetchMock = vi.fn();
const toastSuccessMock = vi.fn<(message: string) => void>();

let lastUseWeekStartDate: string = "";

vi.mock("@app/lib/hooks", () => ({
  useListPopulatedWeeks: () => ({
    data: listState.data,
    isLoading: listState.isLoading,
    error: listState.error,
    refetch: refetchMock,
  }),
  useWeek: (_planId: string, startDate: string) => {
    lastUseWeekStartDate = startDate;

    return {
      data: { week: null, days: weekState.daysByStartDate.get(startDate) ?? [] },
      isFetching: weekState.isFetching,
    };
  },
  useCloneDayFrom: () => ({
    mutate: cloneMutate,
    isPending: cloneState.isPending,
    error: cloneState.error,
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: (message: string) => toastSuccessMock(message) },
}));

const { CloneDayModal } = await import("./clone-day-modal");

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
    makeSession(`clp9z8x7w0000abc${dayOfWeek}${index}xx`),
  ),
});

const makePopulatedWeek = (startDate: string, sessionCount: number): PopulatedWeek => ({
  startDate,
  sessionCount,
  dayCount: 1,
});

const onCloseMock = vi.fn();

const renderModal = (currentSessionCount = 2) =>
  render(
    <CloneDayModal
      open
      onClose={onCloseMock}
      planId={PLAN_ID}
      targetStartDate={TARGET_START_DATE}
      targetDayOfWeek={TARGET_DAY}
      currentSessionCount={currentSessionCount}
    />,
  );

const pickWeek = (startDate: string): void => {
  fireEvent.click(screen.getByText(formatWeekRow(startDate)));
};

const formatWeekRow = (startDate: string): string => {
  const week = listState.data?.weeks.find((candidate) => candidate.startDate === startDate);

  if (week === undefined) {
    throw new Error(`no mock week for ${startDate}`);
  }

  return `${week.sessionCount} sessions · ${week.dayCount} days`;
};

beforeEach(() => {
  listState.data = {
    weeks: [makePopulatedWeek(WEEK_1, 3), makePopulatedWeek(WEEK_2, 7)],
  };
  listState.isLoading = false;
  listState.error = null;
  weekState.daysByStartDate = new Map([
    [WEEK_1, [makeDay("WEDNESDAY", 2)]],
    [WEEK_2, [makeDay("FRIDAY", 4)]],
  ]);
  weekState.isFetching = false;
  cloneState.isPending = false;
  cloneState.error = null;
  cloneMutate.mockReset();
  refetchMock.mockReset();
  toastSuccessMock.mockReset();
  onCloseMock.mockReset();
  lastUseWeekStartDate = "";
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CloneDayModal two-step flow", () => {
  it("walks week-pick → day-pick → danger confirm and mutates with the source week + day", () => {
    renderModal(2);

    pickWeek(WEEK_1);

    expect(screen.getByText("Wednesday — 2 sessions")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Wednesday — 2 sessions"));

    const dialog = screen.getByRole("dialog");

    expect(
      within(dialog).getByText(/This day's 2 sessions will be deleted and replaced with/),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: CONFIRM_LABEL })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: CONFIRM_LABEL }));

    expect(cloneMutate).toHaveBeenCalledTimes(1);
    expect(cloneMutate.mock.calls[0]?.[0]).toEqual({
      sourceStartDate: WEEK_1,
      sourceDayOfWeek: "WEDNESDAY",
    });
  });
});

describe("CloneDayModal union arms", () => {
  it("toasts the server day session count and closes on the cloned:true arm", () => {
    cloneMutate.mockImplementation((_vars, opts) => {
      opts.onSuccess({ cloned: true, day: makeDay("WEDNESDAY", 6) });
    });

    renderModal();

    pickWeek(WEEK_1);
    fireEvent.click(screen.getByText("Wednesday — 2 sessions"));
    fireEvent.click(screen.getByRole("button", { name: CONFIRM_LABEL }));

    expect(toastSuccessMock).toHaveBeenCalledTimes(1);
    expect(toastSuccessMock).toHaveBeenCalledWith("Day replaced — 6 sessions cloned.");
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it("renders the info notice without toasting or closing on the cloned:false empty-source arm", () => {
    cloneMutate.mockImplementation((_vars, opts) => {
      opts.onSuccess({ cloned: false, reason: "empty-source" });
    });

    renderModal();

    pickWeek(WEEK_1);
    fireEvent.click(screen.getByText("Wednesday — 2 sessions"));
    fireEvent.click(screen.getByRole("button", { name: CONFIRM_LABEL }));

    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(onCloseMock).not.toHaveBeenCalled();
    expect(screen.getByText(/is empty\s*— nothing to clone/)).toBeInTheDocument();
  });
});

describe("CloneDayModal back navigation (Must-Test #7 / QA-008 regression)", () => {
  it("clears the picked week on Back so re-picking a different week shows that week's days", () => {
    renderModal();

    pickWeek(WEEK_1);

    expect(screen.getByText("Wednesday — 2 sessions")).toBeInTheDocument();
    expect(lastUseWeekStartDate).toBe(WEEK_1);

    fireEvent.click(screen.getByRole("button", { name: "Back to week list" }));

    expect(screen.getByText("7 sessions · 1 days")).toBeInTheDocument();

    pickWeek(WEEK_2);

    expect(lastUseWeekStartDate).toBe(WEEK_2);
    expect(screen.getByText("Friday — 4 sessions")).toBeInTheDocument();
    expect(screen.queryByText("Wednesday — 2 sessions")).toBeNull();
  });

  it("guards a day pick while the source week is still loading", () => {
    weekState.isFetching = true;

    renderModal();

    pickWeek(WEEK_1);

    const skeletonHost = screen.getByRole("dialog");

    expect(skeletonHost.querySelectorAll(".MuiSkeleton-root").length).toBeGreaterThan(0);
    expect(cloneMutate).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: CONFIRM_LABEL })).toBeNull();
  });
});
