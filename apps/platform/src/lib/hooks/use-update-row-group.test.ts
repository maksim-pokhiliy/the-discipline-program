import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { RowGroup, UpdateRowGroupRequest } from "@repo/contracts/lms/row-group";
import type * as Query from "@repo/query";

import { platformKeys } from "../api/keys";

const updateRowGroupMock =
  vi.fn<(planId: string, rowGroupId: string, data: UpdateRowGroupRequest) => Promise<RowGroup>>();
const toastSuccessMock = vi.fn<(message: string) => void>();
const notifyErrorMock = vi.fn<(error: Error, fallback: string) => void>();

vi.mock("../api", () => ({
  api: {
    rowGroups: {
      update: (planId: string, rowGroupId: string, data: UpdateRowGroupRequest) =>
        updateRowGroupMock(planId, rowGroupId, data),
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

const { useUpdateRowGroup } = await import("./use-update-row-group");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const ROW_GROUP_ID = "clp9z8x7w0000abcd1234grp1";
const SCHEMA_ID = "clp9z8x7w0000abcd1234sch1";
const NOW = new Date("2026-01-06T00:00:00.000Z");

const renderRunner = () => {
  const queryClient = new QueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const view = renderHook(() => useUpdateRowGroup(PLAN_ID, START_DATE), { wrapper });

  return { view, invalidateSpy };
};

describe("useUpdateRowGroup", () => {
  beforeEach(() => {
    updateRowGroupMock.mockReset();
    toastSuccessMock.mockReset();
    notifyErrorMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls the row-group update endpoint with the label notes and invalidates the week", async () => {
    updateRowGroupMock.mockResolvedValueOnce({
      id: ROW_GROUP_ID,
      schemaId: SCHEMA_ID,
      notes: ["OR"],
      createdAt: NOW,
      updatedAt: NOW,
    } satisfies RowGroup);

    const { view, invalidateSpy } = renderRunner();

    await act(async () => {
      view.result.current.mutate({ rowGroupId: ROW_GROUP_ID, data: { notes: ["OR"] } });
    });

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(updateRowGroupMock).toHaveBeenCalledWith(PLAN_ID, ROW_GROUP_ID, { notes: ["OR"] });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: platformKeys.weeks.byDate(PLAN_ID, START_DATE),
    });
    expect(toastSuccessMock).toHaveBeenCalledTimes(1);
    expect(notifyErrorMock).not.toHaveBeenCalled();
  });
});
