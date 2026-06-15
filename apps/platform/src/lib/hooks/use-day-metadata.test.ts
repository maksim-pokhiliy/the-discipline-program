import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DayOfWeek } from "@repo/contracts/lms/_shared";
import type { CloneDayFromRequest, CloneDayResponse, DaySlot } from "@repo/contracts/lms/day";
import type * as Query from "@repo/query";

import { platformKeys } from "../api/keys";

const cloneFromMock =
  vi.fn<
    (
      planId: string,
      startDate: string,
      dayOfWeek: DayOfWeek,
      data: CloneDayFromRequest,
    ) => Promise<CloneDayResponse>
  >();
const toastSuccessMock = vi.fn<(message: string) => void>();
const notifyErrorMock = vi.fn<(error: Error, fallback: string) => void>();

vi.mock("../api", () => ({
  api: {
    dayMetadata: {
      cloneFrom: (
        planId: string,
        startDate: string,
        dayOfWeek: DayOfWeek,
        data: CloneDayFromRequest,
      ) => cloneFromMock(planId, startDate, dayOfWeek, data),
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

const { useCloneDayFrom } = await import("./use-day-metadata");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const TARGET_START_DATE = "2026-01-06";
const TARGET_DAY: DayOfWeek = "WEDNESDAY";
const SOURCE_START_DATE = "2025-12-30";
const SOURCE_DAY: DayOfWeek = "MONDAY";

const makeDaySlot = (): DaySlot => ({
  dayOfWeek: TARGET_DAY,
  label: null,
  notes: null,
  sessions: [],
});

const renderRunner = () => {
  const queryClient = new QueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const view = renderHook(() => useCloneDayFrom(PLAN_ID, TARGET_START_DATE, TARGET_DAY), {
    wrapper,
  });

  return { view, invalidateSpy };
};

describe("useCloneDayFrom", () => {
  beforeEach(() => {
    cloneFromMock.mockReset();
    toastSuccessMock.mockReset();
    notifyErrorMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls the day clone-from endpoint with the target coordinates and the source body", async () => {
    cloneFromMock.mockResolvedValueOnce({ cloned: true, day: makeDaySlot() });

    const { view } = renderRunner();

    await act(async () => {
      view.result.current.mutate({
        sourceStartDate: SOURCE_START_DATE,
        sourceDayOfWeek: SOURCE_DAY,
      });
    });

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(cloneFromMock).toHaveBeenCalledWith(PLAN_ID, TARGET_START_DATE, TARGET_DAY, {
      sourceStartDate: SOURCE_START_DATE,
      sourceDayOfWeek: SOURCE_DAY,
    });
  });

  it("invalidates the TARGET week on the cloned:true arm without toasting (toast lives in the modal)", async () => {
    cloneFromMock.mockResolvedValueOnce({ cloned: true, day: makeDaySlot() });

    const { view, invalidateSpy } = renderRunner();

    await act(async () => {
      view.result.current.mutate({
        sourceStartDate: SOURCE_START_DATE,
        sourceDayOfWeek: SOURCE_DAY,
      });
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
      view.result.current.mutate({
        sourceStartDate: SOURCE_START_DATE,
        sourceDayOfWeek: SOURCE_DAY,
      });
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
      view.result.current.mutate({
        sourceStartDate: SOURCE_START_DATE,
        sourceDayOfWeek: SOURCE_DAY,
      });
    });

    await waitFor(() => expect(view.result.current.isError).toBe(true));

    expect(notifyErrorMock).toHaveBeenCalledWith(failure, "Couldn't clone — try again.");
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });
});
