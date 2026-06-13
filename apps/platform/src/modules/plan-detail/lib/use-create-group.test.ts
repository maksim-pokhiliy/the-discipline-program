import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Schema, SchemaWithBody } from "@repo/contracts/lms/schema";
import type {
  CreateGroupRequest,
  CreateGroupResponse,
  SchemaGroup,
} from "@repo/contracts/lms/schema-group";

import { platformKeys } from "@app/lib/api/keys";

import type { GroupDraft, TrackDraft } from "../components/axes/axis-draft.types";

import { asNodeId } from "./axis-draft-id";

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

const { useCreateGroup } = await import("./use-create-group");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const GROUP_ID = "clp9z8x7w0000abcd1234grp1";
const MEMBER_ID = "clp9z8x7w0000abcd1234mem1";
const NOW = new Date("2026-01-06T00:00:00.000Z");
const SUCCESS_MESSAGE = "Group created";

const memberStub = (id: string): SchemaWithBody => ({
  schema: {
    id,
    blockId: BLOCK_ID,
    groupId: GROUP_ID,
    order: 1,
    header: null,
    intensity: null,
    composition: { repetition: { kind: "ladder", steps: [21, 15, 9] } },
    label: null,
    notes: null,
    createdAt: NOW,
    updatedAt: NOW,
  } satisfies Schema,
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
  members: [memberStub(MEMBER_ID)],
});

const ladderTrack = (id: string, steps: number[]): TrackDraft => ({
  id: asNodeId(id),
  header: null,
  steps,
});

const parentDraft = (tracks: TrackDraft[], header: string | null = null): GroupDraft => ({
  id: asNodeId("parent-draft-1"),
  header,
  tracks,
});

const renderSubmitter = () => {
  const queryClient = new QueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const view = renderHook(() => useCreateGroup(PLAN_ID, START_DATE), { wrapper });

  return { view, invalidateSpy };
};

describe("useCreateGroup", () => {
  beforeEach(() => {
    createGroupMock.mockReset();
    toastSuccessMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends exactly one group-create request carrying every track and the draft header as label", async () => {
    createGroupMock.mockResolvedValueOnce(groupResponse());

    const { view, invalidateSpy } = renderSubmitter();
    const onSuccess = vi.fn();
    const onError = vi.fn();

    await act(async () => {
      await view.result.current.run(
        {
          blockId: BLOCK_ID,
          draft: parentDraft(
            [ladderTrack("t1", [21, 15, 9]), ladderTrack("t2", [15, 12, 9])],
            "WOD A",
          ),
        },
        { onSuccess, onError },
      );
    });

    expect(createGroupMock).toHaveBeenCalledTimes(1);
    expect(createGroupMock).toHaveBeenCalledWith(PLAN_ID, {
      blockId: BLOCK_ID,
      notes: ["WOD A"],
      tracks: [
        { header: null, steps: [21, 15, 9] },
        { header: null, steps: [15, 12, 9] },
      ],
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

  it("never hits the network when a track has zero steps", async () => {
    const { view, invalidateSpy } = renderSubmitter();
    const onSuccess = vi.fn();
    const onError = vi.fn();

    await act(async () => {
      await view.result.current.run(
        {
          blockId: BLOCK_ID,
          draft: parentDraft([ladderTrack("t1", [21, 15, 9]), ladderTrack("t2", [])]),
        },
        { onSuccess, onError },
      );
    });

    expect(createGroupMock).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toMatch(/^ladder 2 steps: /);
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
          draft: parentDraft([ladderTrack("t1", [21, 15, 9]), ladderTrack("t2", [15, 12, 9])]),
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
          draft: parentDraft([ladderTrack("t1", [21, 15, 9]), ladderTrack("t2", [15, 12, 9])]),
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
