import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  CloneWeekFromRequest,
  CloneWeekResponse,
  PopulatedWeeksResponse,
  Week,
} from "@repo/contracts/lms/week";
import type * as Query from "@repo/query";

import { platformKeys } from "../api/keys";

const cloneFromMock =
  vi.fn<
    (planId: string, startDate: string, data: CloneWeekFromRequest) => Promise<CloneWeekResponse>
  >();
const listPopulatedMock = vi.fn<(planId: string) => Promise<PopulatedWeeksResponse>>();
const toastSuccessMock = vi.fn<(message: string) => void>();
const notifyErrorMock = vi.fn<(error: Error, fallback: string) => void>();

vi.mock("../api", () => ({
  api: {
    weeks: {
      cloneFrom: (planId: string, startDate: string, data: CloneWeekFromRequest) =>
        cloneFromMock(planId, startDate, data),
      listPopulated: (planId: string) => listPopulatedMock(planId),
    },
  },
}));

vi.mock("sonner", () => ({
  toast: { success: (message: string) => toastSuccessMock(message) },
}));

vi.mock("@repo/query", async (importOriginal) => {
  const actual = await importOriginal<typeof Query>();

  return {
    ...actual,
    notifyError: (error: Error, fallback: string) => notifyErrorMock(error, fallback),
  };
});

const { useCloneWeekFrom, useListPopulatedWeeks } = await import("./use-weeks");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const TARGET_START_DATE = "2026-01-06";
const SOURCE_START_DATE = "2025-12-30";

const makeWeek = (): Week => ({
  id: "clp9z8x7w0000abcd1234week",
  planId: PLAN_ID,
  startDate: new Date("2026-01-06T00:00:00.000Z"),
  notes: null,
  createdAt: new Date("2026-01-06T00:00:00.000Z"),
  updatedAt: new Date("2026-01-06T00:00:00.000Z"),
});

const renderRunner = () => {
  const queryClient = new QueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const view = renderHook(() => useCloneWeekFrom(PLAN_ID, TARGET_START_DATE), { wrapper });

  return { view, invalidateSpy };
};

const renderListRunner = (enabled: boolean) => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const view = renderHook(() => useListPopulatedWeeks(PLAN_ID, enabled), { wrapper });

  return { view, queryClient };
};

describe("useCloneWeekFrom", () => {
  beforeEach(() => {
    cloneFromMock.mockReset();
    listPopulatedMock.mockReset();
    toastSuccessMock.mockReset();
    notifyErrorMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls the week clone-from endpoint with the target start date and source body", async () => {
    cloneFromMock.mockResolvedValueOnce({ cloned: true, week: makeWeek() });

    const { view } = renderRunner();

    await act(async () => {
      view.result.current.mutate({ sourceStartDate: SOURCE_START_DATE });
    });

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(cloneFromMock).toHaveBeenCalledWith(PLAN_ID, TARGET_START_DATE, {
      sourceStartDate: SOURCE_START_DATE,
    });
  });

  it("invalidates the target week on the cloned:true arm without toasting (toast lives in the modal)", async () => {
    cloneFromMock.mockResolvedValueOnce({ cloned: true, week: makeWeek() });

    const { view, invalidateSpy } = renderRunner();

    await act(async () => {
      view.result.current.mutate({ sourceStartDate: SOURCE_START_DATE });
    });

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: platformKeys.weeks.byDate(PLAN_ID, TARGET_START_DATE),
    });
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });

  it("does NOT invalidate or toast on the cloned:false empty-source arm", async () => {
    cloneFromMock.mockResolvedValueOnce({ cloned: false, reason: "empty-source" });

    const { view, invalidateSpy } = renderRunner();

    await act(async () => {
      view.result.current.mutate({ sourceStartDate: SOURCE_START_DATE });
    });

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(notifyErrorMock).not.toHaveBeenCalled();
  });

  it("notifies the error fallback when the clone rejects", async () => {
    const failure = new Error("boom");

    cloneFromMock.mockRejectedValueOnce(failure);

    const { view } = renderRunner();

    await act(async () => {
      view.result.current.mutate({ sourceStartDate: SOURCE_START_DATE });
    });

    await waitFor(() => expect(view.result.current.isError).toBe(true));

    expect(notifyErrorMock).toHaveBeenCalledWith(failure, "Couldn't clone — try again.");
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });
});

describe("useListPopulatedWeeks", () => {
  beforeEach(() => {
    listPopulatedMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does NOT call the list endpoint while disabled (lazy gate)", async () => {
    listPopulatedMock.mockResolvedValue({ weeks: [] });

    const { view } = renderListRunner(false);

    await waitFor(() => expect(view.result.current.fetchStatus).toBe("idle"));

    expect(listPopulatedMock).not.toHaveBeenCalled();
    expect(view.result.current.data).toBeUndefined();
  });

  it("calls the list endpoint with the planId and keys it under weeks.populated when enabled", async () => {
    listPopulatedMock.mockResolvedValueOnce({
      weeks: [{ startDate: "2026-01-06", sessionCount: 5, dayCount: 4 }],
    });

    const { view, queryClient } = renderListRunner(true);

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(listPopulatedMock).toHaveBeenCalledWith(PLAN_ID);
    expect(
      queryClient.getQueryCache().find({ queryKey: platformKeys.weeks.populated(PLAN_ID) }),
    ).toBeDefined();
  });
});
