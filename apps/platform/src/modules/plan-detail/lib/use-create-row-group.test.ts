import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  CreateRowGroupRequest,
  CreateRowGroupResponse,
  RowGroup,
} from "@repo/contracts/lms/row-group";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { platformKeys } from "@app/lib/api/keys";

const createRowGroupMock =
  vi.fn<(planId: string, data: CreateRowGroupRequest) => Promise<CreateRowGroupResponse>>();
const toastSuccessMock = vi.fn<(message: string) => void>();

vi.mock("@app/lib/api", () => ({
  api: {
    rowGroups: {
      create: (planId: string, data: CreateRowGroupRequest) => createRowGroupMock(planId, data),
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: (message: string) => toastSuccessMock(message),
  },
}));

const { useCreateRowGroup } = await import("./use-create-row-group");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const SCHEMA_ID = "clp9z8x7w0000abcd1234sch1";
const GROUP_ID = "clp9z8x7w0000abcd1234grp1";
const EXERCISE_ID = "clp9z8x7w0000abcd1234ex001";
const NOW = new Date("2026-01-06T00:00:00.000Z");
const SUCCESS_MESSAGE = "Group created";
const R1 = "clp9z8x7w0000abcd12rg1r001";
const R2 = "clp9z8x7w0000abcd12rg1r002";
const R3 = "clp9z8x7w0000abcd12rg1r003";

const makeRow = (id: string, order: number): SchemaRow => ({
  id,
  schemaId: SCHEMA_ID,
  order,
  exerciseId: EXERCISE_ID,
  sets: null,
  rowGroupId: null,
  load: null,
  reps: null,
  side: null,
  tempo: null,
  intensity: null,
  rest: null,
  media: null,
  modifiers: [],
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const rowGroupResponse = (): CreateRowGroupResponse => ({
  group: {
    id: GROUP_ID,
    schemaId: SCHEMA_ID,
    notes: null,
    createdAt: NOW,
    updatedAt: NOW,
  } satisfies RowGroup,
  members: [makeRow(R1, 1), makeRow(R2, 2)],
});

const renderSubmitter = () => {
  const queryClient = new QueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const view = renderHook(() => useCreateRowGroup(PLAN_ID, START_DATE), { wrapper });

  return { view, invalidateSpy };
};

describe("useCreateRowGroup", () => {
  beforeEach(() => {
    createRowGroupMock.mockReset();
    toastSuccessMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends one create request with the rowIds sorted by order and invalidates the week once", async () => {
    createRowGroupMock.mockResolvedValueOnce(rowGroupResponse());

    const { view, invalidateSpy } = renderSubmitter();
    const onSuccess = vi.fn();
    const onError = vi.fn();

    await act(async () => {
      await view.result.current.run(
        {
          schemaId: SCHEMA_ID,
          rows: [makeRow(R2, 2), makeRow(R1, 1)],
          selectedIds: new Set([R1, R2]),
        },
        { onSuccess, onError },
      );
    });

    expect(createRowGroupMock).toHaveBeenCalledTimes(1);
    expect(createRowGroupMock).toHaveBeenCalledWith(PLAN_ID, {
      schemaId: SCHEMA_ID,
      rowIds: [R1, R2],
      notes: null,
    });
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: platformKeys.weeks.byDate(PLAN_ID, START_DATE),
    });
    expect(toastSuccessMock).toHaveBeenCalledTimes(1);
    expect(toastSuccessMock).toHaveBeenCalledWith(SUCCESS_MESSAGE);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it("never hits the network when the selection is non-contiguous", async () => {
    const { view, invalidateSpy } = renderSubmitter();
    const onSuccess = vi.fn();
    const onError = vi.fn();

    await act(async () => {
      await view.result.current.run(
        {
          schemaId: SCHEMA_ID,
          rows: [makeRow(R1, 1), makeRow(R2, 2), makeRow(R3, 3)],
          selectedIds: new Set([R1, R3]),
        },
        { onSuccess, onError },
      );
    });

    expect(createRowGroupMock).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith("Selected rows must be next to each other");
    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("surfaces the failure without a toast and still invalidates once when the request rejects", async () => {
    createRowGroupMock.mockRejectedValueOnce(new Error("network exploded"));

    const { view, invalidateSpy } = renderSubmitter();
    const onSuccess = vi.fn();
    const onError = vi.fn();

    await act(async () => {
      await view.result.current.run(
        {
          schemaId: SCHEMA_ID,
          rows: [makeRow(R1, 1), makeRow(R2, 2)],
          selectedIds: new Set([R1, R2]),
        },
        { onSuccess, onError },
      );
    });

    expect(createRowGroupMock).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith("network exploded");
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("toggles isPending true while running then back to false", async () => {
    let resolveRequest: ((response: CreateRowGroupResponse) => void) | undefined;
    const pendingRequest = new Promise<CreateRowGroupResponse>((resolve) => {
      resolveRequest = resolve;
    });

    createRowGroupMock.mockReturnValueOnce(pendingRequest);

    const { view } = renderSubmitter();

    expect(view.result.current.isPending).toBe(false);

    let runPromise: Promise<void> = Promise.resolve();

    await act(async () => {
      runPromise = view.result.current.run(
        {
          schemaId: SCHEMA_ID,
          rows: [makeRow(R1, 1), makeRow(R2, 2)],
          selectedIds: new Set([R1, R2]),
        },
        { onSuccess: vi.fn(), onError: vi.fn() },
      );
    });

    expect(view.result.current.isPending).toBe(true);

    await act(async () => {
      resolveRequest?.(rowGroupResponse());
      await runPromise;
    });

    expect(view.result.current.isPending).toBe(false);
  });
});
