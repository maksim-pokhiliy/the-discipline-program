import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SchemaWithBody } from "@repo/contracts/lms/schema";
import type {
  CreateGroupRequest,
  CreateGroupResponse,
  SchemaGroup,
} from "@repo/contracts/lms/schema-group";

import { platformKeys } from "@app/lib/api/keys";

const createGroupMock =
  vi.fn<(planId: string, data: CreateGroupRequest) => Promise<CreateGroupResponse>>();
const toastSuccessMock = vi.fn<(message: string) => void>();

vi.mock("@app/lib/api", () => ({
  api: {
    groups: {
      create: (planId: string, data: CreateGroupRequest) => createGroupMock(planId, data),
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: (message: string) => toastSuccessMock(message),
  },
}));

const { useCreateSchemaGroup } = await import("./use-create-schema-group");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const GROUP_ID = "clp9z8x7w0000abcd1234grp1";
const NOW = new Date("2026-01-06T00:00:00.000Z");
const SUCCESS_MESSAGE = "Group created";
const S1 = "clp9z8x7w0000abcd12sg2s001";
const S2 = "clp9z8x7w0000abcd12sg2s002";
const S3 = "clp9z8x7w0000abcd12sg2s003";

const makeSchema = (id: string, order: number): SchemaWithBody => ({
  schema: {
    id,
    blockId: BLOCK_ID,
    groupId: null,
    order,
    header: null,
    intensity: null,
    composition: null,
    label: null,
    notes: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  rows: [],
  rowGroups: [],
});

const groupResponse = (): CreateGroupResponse => ({
  group: {
    id: GROUP_ID,
    blockId: BLOCK_ID,
    notes: null,
    interleaveOrder: "round_by_round",
    createdAt: NOW,
    updatedAt: NOW,
  } satisfies SchemaGroup,
  members: [makeSchema(S1, 1), makeSchema(S2, 2)],
});

const renderSubmitter = () => {
  const queryClient = new QueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const view = renderHook(() => useCreateSchemaGroup(PLAN_ID, START_DATE), { wrapper });

  return { view, invalidateSpy };
};

describe("useCreateSchemaGroup", () => {
  beforeEach(() => {
    createGroupMock.mockReset();
    toastSuccessMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends one create request with the schemaIds sorted by order and invalidates the week once", async () => {
    createGroupMock.mockResolvedValueOnce(groupResponse());

    const { view, invalidateSpy } = renderSubmitter();
    const onSuccess = vi.fn();
    const onError = vi.fn();

    await act(async () => {
      await view.result.current.run(
        {
          blockId: BLOCK_ID,
          schemas: [makeSchema(S2, 2), makeSchema(S1, 1)],
          selectedIds: new Set([S1, S2]),
        },
        { onSuccess, onError },
      );
    });

    expect(createGroupMock).toHaveBeenCalledTimes(1);
    expect(createGroupMock).toHaveBeenCalledWith(PLAN_ID, {
      blockId: BLOCK_ID,
      schemaIds: [S1, S2],
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
          blockId: BLOCK_ID,
          schemas: [makeSchema(S1, 1), makeSchema(S2, 2), makeSchema(S3, 3)],
          selectedIds: new Set([S1, S3]),
        },
        { onSuccess, onError },
      );
    });

    expect(createGroupMock).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith("Selected schemas must be next to each other");
    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("surfaces the failure without a toast and still invalidates once when the request rejects", async () => {
    createGroupMock.mockRejectedValueOnce(new Error("network exploded"));

    const { view, invalidateSpy } = renderSubmitter();
    const onSuccess = vi.fn();
    const onError = vi.fn();

    await act(async () => {
      await view.result.current.run(
        {
          blockId: BLOCK_ID,
          schemas: [makeSchema(S1, 1), makeSchema(S2, 2)],
          selectedIds: new Set([S1, S2]),
        },
        { onSuccess, onError },
      );
    });

    expect(createGroupMock).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith("network exploded");
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("toggles isPending true while running then back to false", async () => {
    let resolveRequest: ((response: CreateGroupResponse) => void) | undefined;
    const pendingRequest = new Promise<CreateGroupResponse>((resolve) => {
      resolveRequest = resolve;
    });

    createGroupMock.mockReturnValueOnce(pendingRequest);

    const { view } = renderSubmitter();

    expect(view.result.current.isPending).toBe(false);

    let runPromise: Promise<void> = Promise.resolve();

    await act(async () => {
      runPromise = view.result.current.run(
        {
          blockId: BLOCK_ID,
          schemas: [makeSchema(S1, 1), makeSchema(S2, 2)],
          selectedIds: new Set([S1, S2]),
        },
        { onSuccess: vi.fn(), onError: vi.fn() },
      );
    });

    expect(view.result.current.isPending).toBe(true);

    await act(async () => {
      resolveRequest?.(groupResponse());
      await runPromise;
    });

    expect(view.result.current.isPending).toBe(false);
  });
});
