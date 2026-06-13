import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { platformKeys } from "@app/lib/api/keys";

const deleteMock = vi.fn<(planId: string, schemaRowId: string) => Promise<void>>();
const toastSuccessMock = vi.fn<(message: string) => void>();
const toastErrorMock = vi.fn<(message: string) => void>();

vi.mock("@app/lib/api", () => ({
  api: {
    schemaRows: {
      delete: (planId: string, schemaRowId: string) => deleteMock(planId, schemaRowId),
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: (message: string) => toastSuccessMock(message),
    error: (message: string) => toastErrorMock(message),
  },
}));

const { useDeleteRowGroupWithMembers } = await import("./use-delete-row-group-with-members");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const SCHEMA_ID = "clp9z8x7w0000abcd1234sch1";
const EXERCISE_ID = "clp9z8x7w0000abcd1234ex001";
const NOW = new Date("2026-01-06T00:00:00.000Z");
const SUCCESS_MESSAGE = "Group deleted";
const FIRST_MEMBER_ID = "clp9z8x7w0000abcd1234mm01";
const SECOND_MEMBER_ID = "clp9z8x7w0000abcd1234mm02";
const THIRD_MEMBER_ID = "clp9z8x7w0000abcd1234mm03";

const memberStub = (id: string, order: number): SchemaRow => ({
  id,
  schemaId: SCHEMA_ID,
  order,
  exerciseId: EXERCISE_ID,
  sets: null,
  rowGroupId: "clp9z8x7w0000abcd1234grp1",
  load: null,
  reps: null,
  side: null,
  tempo: null,
  media: null,
  modifiers: [],
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const renderRunner = () => {
  const queryClient = new QueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const view = renderHook(() => useDeleteRowGroupWithMembers(PLAN_ID, START_DATE), { wrapper });

  return { view, invalidateSpy };
};

describe("useDeleteRowGroupWithMembers", () => {
  beforeEach(() => {
    deleteMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fires one delete per member row in order, toasts success and invalidates once", async () => {
    deleteMock.mockResolvedValue(undefined);

    const { view, invalidateSpy } = renderRunner();

    await act(async () => {
      await view.result.current.run({
        members: [
          memberStub(FIRST_MEMBER_ID, 1),
          memberStub(SECOND_MEMBER_ID, 2),
          memberStub(THIRD_MEMBER_ID, 3),
        ],
      });
    });

    expect(deleteMock).toHaveBeenCalledTimes(3);
    expect(deleteMock).toHaveBeenNthCalledWith(1, PLAN_ID, FIRST_MEMBER_ID);
    expect(deleteMock).toHaveBeenNthCalledWith(2, PLAN_ID, SECOND_MEMBER_ID);
    expect(deleteMock).toHaveBeenNthCalledWith(3, PLAN_ID, THIRD_MEMBER_ID);
    expect(toastSuccessMock).toHaveBeenCalledTimes(1);
    expect(toastSuccessMock).toHaveBeenCalledWith(SUCCESS_MESSAGE);
    expect(toastErrorMock).not.toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: platformKeys.weeks.byDate(PLAN_ID, START_DATE),
    });
  });

  it("stops on the first failure, toasts the partial-failure message and still invalidates once", async () => {
    deleteMock
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("network exploded"))
      .mockResolvedValueOnce(undefined);

    const { view, invalidateSpy } = renderRunner();

    await act(async () => {
      await view.result.current.run({
        members: [
          memberStub(FIRST_MEMBER_ID, 1),
          memberStub(SECOND_MEMBER_ID, 2),
          memberStub(THIRD_MEMBER_ID, 3),
        ],
      });
    });

    expect(deleteMock).toHaveBeenCalledTimes(2);
    expect(toastErrorMock).toHaveBeenCalledTimes(1);
    expect(toastErrorMock).toHaveBeenCalledWith(
      "Deleted 1 of 3 rows; the rest stay a valid group: network exploded",
    );
    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
  });

  it("toggles isPending true while running then back to false", async () => {
    let resolveDelete: (() => void) | undefined;
    const pendingDelete = new Promise<void>((resolve) => {
      resolveDelete = resolve;
    });

    deleteMock.mockReturnValueOnce(pendingDelete).mockResolvedValueOnce(undefined);

    const { view } = renderRunner();

    expect(view.result.current.isPending).toBe(false);

    let runPromise: Promise<void> = Promise.resolve();

    await act(async () => {
      runPromise = view.result.current.run({
        members: [memberStub(FIRST_MEMBER_ID, 1), memberStub(SECOND_MEMBER_ID, 2)],
      });
    });

    expect(view.result.current.isPending).toBe(true);

    await act(async () => {
      resolveDelete?.();
      await runPromise;
    });

    expect(view.result.current.isPending).toBe(false);
  });

  it("runs the delete sequence once on a synchronous double-fire, never the contradictory toast", async () => {
    let resolveDelete: (() => void) | undefined;
    const pendingDelete = new Promise<void>((resolve) => {
      resolveDelete = resolve;
    });

    deleteMock.mockReturnValueOnce(pendingDelete).mockResolvedValue(undefined);

    const { view, invalidateSpy } = renderRunner();
    const members = [memberStub(FIRST_MEMBER_ID, 1), memberStub(SECOND_MEMBER_ID, 2)];

    let firstRun: Promise<void> = Promise.resolve();
    let secondRun: Promise<void> = Promise.resolve();

    await act(async () => {
      firstRun = view.result.current.run({ members });
      secondRun = view.result.current.run({ members });
    });

    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(deleteMock).toHaveBeenNthCalledWith(1, PLAN_ID, FIRST_MEMBER_ID);

    await act(async () => {
      resolveDelete?.();
      await Promise.all([firstRun, secondRun]);
    });

    expect(deleteMock).toHaveBeenCalledTimes(2);
    expect(deleteMock).toHaveBeenNthCalledWith(2, PLAN_ID, SECOND_MEMBER_ID);
    expect(toastSuccessMock).toHaveBeenCalledTimes(1);
    expect(toastSuccessMock).toHaveBeenCalledWith(SUCCESS_MESSAGE);
    expect(toastErrorMock).not.toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
  });
});
