import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type * as Query from "@repo/query";

import { platformKeys } from "../api/keys";

const deleteRowGroupMock = vi.fn<(planId: string, rowGroupId: string) => Promise<void>>();
const toastSuccessMock = vi.fn<(message: string) => void>();
const notifyErrorMock = vi.fn<(error: Error, fallback: string) => void>();

vi.mock("../api", () => ({
  api: {
    rowGroups: {
      delete: (planId: string, rowGroupId: string) => deleteRowGroupMock(planId, rowGroupId),
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

const { useDeleteRowGroup } = await import("./use-delete-row-group");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const ROW_GROUP_ID = "clp9z8x7w0000abcd1234grp1";

const renderRunner = () => {
  const queryClient = new QueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const view = renderHook(() => useDeleteRowGroup(PLAN_ID, START_DATE), { wrapper });

  return { view, invalidateSpy };
};

describe("useDeleteRowGroup", () => {
  beforeEach(() => {
    deleteRowGroupMock.mockReset();
    toastSuccessMock.mockReset();
    notifyErrorMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls the row-group delete endpoint and invalidates the week on success", async () => {
    deleteRowGroupMock.mockResolvedValueOnce(undefined);

    const { view, invalidateSpy } = renderRunner();

    await act(async () => {
      view.result.current.mutate({ rowGroupId: ROW_GROUP_ID });
    });

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(deleteRowGroupMock).toHaveBeenCalledWith(PLAN_ID, ROW_GROUP_ID);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: platformKeys.weeks.byDate(PLAN_ID, START_DATE),
    });
    expect(toastSuccessMock).toHaveBeenCalledTimes(1);
    expect(notifyErrorMock).not.toHaveBeenCalled();
  });

  it("notifies the error fallback when the delete rejects", async () => {
    deleteRowGroupMock.mockRejectedValueOnce(new Error("boom"));

    const { view } = renderRunner();

    await act(async () => {
      view.result.current.mutate({ rowGroupId: ROW_GROUP_ID });
    });

    await waitFor(() => expect(view.result.current.isError).toBe(true));

    expect(notifyErrorMock).toHaveBeenCalledTimes(1);
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });
});
