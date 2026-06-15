import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CloneWeekResponse, PopulatedWeek, Week } from "@repo/contracts/lms/week";

import { render } from "@app/test/render";

type CloneOnSuccess = (result: CloneWeekResponse) => void;

const NOW = new Date("2026-01-06T00:00:00.000Z");
const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const TARGET_START_DATE = "2026-01-05";
const SOURCE_START_DATE = "2025-12-29";
const CONFIRM_LABEL = "Replace week";

const listState = {
  data: undefined as { weeks: PopulatedWeek[] } | undefined,
  isLoading: false,
  error: null as Error | null,
};
const cloneState = { isPending: false, error: null as Error | null };
const cloneMutate =
  vi.fn<(vars: { sourceStartDate: string }, opts: { onSuccess: CloneOnSuccess }) => void>();
const refetchMock = vi.fn();
const toastSuccessMock = vi.fn<(message: string) => void>();

vi.mock("@app/lib/hooks", () => ({
  useListPopulatedWeeks: () => ({
    data: listState.data,
    isLoading: listState.isLoading,
    error: listState.error,
    refetch: refetchMock,
  }),
  useCloneWeekFrom: () => ({
    mutate: cloneMutate,
    isPending: cloneState.isPending,
    error: cloneState.error,
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: (message: string) => toastSuccessMock(message) },
}));

const { CloneWeekModal } = await import("./clone-week-modal");

const makeWeek = (overrides: Partial<PopulatedWeek> = {}): PopulatedWeek => ({
  startDate: SOURCE_START_DATE,
  sessionCount: 5,
  dayCount: 4,
  ...overrides,
});

const makeWeekEntity = (): Week => ({
  id: "clp9z8x7w0000abcd1234week",
  planId: PLAN_ID,
  startDate: NOW,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const renderModal = (currentSessionCount = 3) =>
  render(
    <CloneWeekModal
      open
      onClose={onCloseMock}
      planId={PLAN_ID}
      targetStartDate={TARGET_START_DATE}
      currentSessionCount={currentSessionCount}
    />,
  );

const onCloseMock = vi.fn();

beforeEach(() => {
  listState.data = { weeks: [makeWeek()] };
  listState.isLoading = false;
  listState.error = null;
  cloneState.isPending = false;
  cloneState.error = null;
  cloneMutate.mockReset();
  refetchMock.mockReset();
  toastSuccessMock.mockReset();
  onCloseMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CloneWeekModal picking step", () => {
  it("excludes the target week from the source list", () => {
    listState.data = {
      weeks: [
        makeWeek({ startDate: TARGET_START_DATE, sessionCount: 9, dayCount: 7 }),
        makeWeek({ startDate: SOURCE_START_DATE, sessionCount: 5, dayCount: 4 }),
      ],
    };

    renderModal();

    expect(screen.getByText("5 sessions · 4 days")).toBeInTheDocument();
    expect(screen.queryByText("9 sessions · 7 days")).toBeNull();
  });
});

describe("CloneWeekModal confirm step", () => {
  it("renders the danger confirm with counts, the Replace week label, and does not auto-focus the confirm", () => {
    renderModal(3);

    fireEvent.click(screen.getByText("5 sessions · 4 days"));

    const dialog = screen.getByRole("dialog");
    const confirmBtn = within(dialog).getByRole("button", { name: CONFIRM_LABEL });

    expect(
      within(dialog).getByText(/This week's 3 sessions will be deleted and replaced with/),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/\(5 sessions\)\. This can't be undone\./)).toBeInTheDocument();
    expect(confirmBtn).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(confirmBtn).not.toBe(document.activeElement);
  });

  it("calls mutate with the picked source start date when confirmed", () => {
    renderModal();

    fireEvent.click(screen.getByText("5 sessions · 4 days"));
    fireEvent.click(screen.getByRole("button", { name: CONFIRM_LABEL }));

    expect(cloneMutate).toHaveBeenCalledTimes(1);
    expect(cloneMutate.mock.calls[0]?.[0]).toEqual({ sourceStartDate: SOURCE_START_DATE });
  });

  it("blocks the cancel/escape affordance while confirming", () => {
    cloneState.isPending = true;

    renderModal();

    fireEvent.click(screen.getByText("5 sessions · 4 days"));

    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeDisabled();
    fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" });
    expect(onCloseMock).not.toHaveBeenCalled();
  });
});

describe("CloneWeekModal union arms", () => {
  it("toasts success and closes on the cloned:true arm", () => {
    cloneMutate.mockImplementation((_vars, opts) => {
      opts.onSuccess({ cloned: true, week: makeWeekEntity() });
    });

    renderModal();

    fireEvent.click(screen.getByText("5 sessions · 4 days"));
    fireEvent.click(screen.getByRole("button", { name: CONFIRM_LABEL }));

    expect(toastSuccessMock).toHaveBeenCalledTimes(1);
    expect(toastSuccessMock.mock.calls[0]?.[0]).toMatch(/^Week replaced — /);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it("renders the info notice and does NOT toast or close on the cloned:false empty-source arm", () => {
    cloneMutate.mockImplementation((_vars, opts) => {
      opts.onSuccess({ cloned: false, reason: "empty-source" });
    });

    renderModal();

    fireEvent.click(screen.getByText("5 sessions · 4 days"));
    fireEvent.click(screen.getByRole("button", { name: CONFIRM_LABEL }));

    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(onCloseMock).not.toHaveBeenCalled();

    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByText(/is empty — nothing to clone/)).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: CONFIRM_LABEL })).toBeNull();
  });
});
