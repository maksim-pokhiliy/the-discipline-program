import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Block } from "@repo/contracts/lms/block";
import type * as Query from "@repo/query";

import { platformKeys } from "../api/keys";

const duplicateBlockMock = vi.fn<(planId: string, blockId: string) => Promise<Block>>();
const toastSuccessMock = vi.fn<(message: string) => void>();
const notifyErrorMock = vi.fn<(error: Error, fallback: string) => void>();

vi.mock("../api", () => ({
  api: {
    blocks: {
      duplicate: (planId: string, blockId: string) => duplicateBlockMock(planId, blockId),
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

const { useDuplicateBlock } = await import("./use-blocks");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const BLOCK_ID = "clp9z8x7w0000abcd1234blk0";

const makeBlock = (overrides: Partial<Block> = {}): Block => ({
  id: BLOCK_ID,
  sessionId: "clp9z8x7w0000abcd1234sess",
  order: 1,
  intensity: null,
  notes: null,
  labels: [],
  schemas: [],
  groups: [],
  createdAt: new Date("2026-01-06T00:00:00.000Z"),
  updatedAt: new Date("2026-01-06T00:00:00.000Z"),
  ...overrides,
});

const renderRunner = () => {
  const queryClient = new QueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const view = renderHook(() => useDuplicateBlock(PLAN_ID, START_DATE), { wrapper });

  return { view, invalidateSpy };
};

describe("useDuplicateBlock", () => {
  beforeEach(() => {
    duplicateBlockMock.mockReset();
    toastSuccessMock.mockReset();
    notifyErrorMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls the block duplicate endpoint with the plan and block ids", async () => {
    duplicateBlockMock.mockResolvedValueOnce(makeBlock());

    const { view } = renderRunner();

    await act(async () => {
      view.result.current.mutate({ blockId: BLOCK_ID });
    });

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(duplicateBlockMock).toHaveBeenCalledWith(PLAN_ID, BLOCK_ID);
  });

  it("invalidates the week query and stays silent (no success toast) on success", async () => {
    duplicateBlockMock.mockResolvedValueOnce(makeBlock());

    const { view, invalidateSpy } = renderRunner();

    await act(async () => {
      view.result.current.mutate({ blockId: BLOCK_ID });
    });

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: platformKeys.weeks.byDate(PLAN_ID, START_DATE),
    });
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });

  it("notifies the error fallback when the duplicate rejects", async () => {
    const failure = new Error("boom");

    duplicateBlockMock.mockRejectedValueOnce(failure);

    const { view } = renderRunner();

    await act(async () => {
      view.result.current.mutate({ blockId: BLOCK_ID });
    });

    await waitFor(() => expect(view.result.current.isError).toBe(true));

    expect(notifyErrorMock).toHaveBeenCalledWith(failure, "Couldn't duplicate — try again.");
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });
});
