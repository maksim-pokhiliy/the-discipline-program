import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CreateSchemaRequest, Schema } from "@repo/contracts/lms/schema";

import { platformKeys } from "@app/lib/api/keys";

import type { ComposeContainer, ComposeNode } from "../components/axes/axis-draft.types";

import { asNodeId } from "./axis-draft-id";

const createMock = vi.fn<(planId: string, data: CreateSchemaRequest) => Promise<Schema>>();
const toastSuccessMock = vi.fn<(message: string) => void>();

vi.mock("@app/lib/api", () => ({
  api: {
    schemas: {
      create: (planId: string, data: CreateSchemaRequest) => createMock(planId, data),
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: (message: string) => toastSuccessMock(message),
  },
}));

const { useCreateIndependentLadders } = await import("./use-create-independent-ladders");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const INCOMING_PARENT_ID = "clp9z8x7w0000abcd1234inc1";
const NOW = new Date("2026-01-06T00:00:00.000Z");
const SUCCESS_MESSAGE = "Ladders created";
const FIRST_LADDER_STEPS = [21, 15, 9];
const SECOND_LADDER_STEPS = [15, 12, 9];
const THIRD_LADDER_STEPS = [10, 8, 6];

const schemaStub = (id: string): Schema => ({
  id,
  blockId: BLOCK_ID,
  parentSchemaId: null,
  order: 1,
  header: null,
  intensity: null,
  composition: null,
  label: null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const ladderTrack = (id: string, steps: number[]): ComposeContainer => ({
  nodeType: "container",
  id: asNodeId(id),
  header: null,
  notes: null,
  repetition: { kind: "ladder", steps },
  children: [],
});

const parentDraft = (children: ComposeNode[]): ComposeContainer => ({
  nodeType: "container",
  id: asNodeId("parent-draft-1"),
  header: null,
  notes: null,
  children,
});

const ladderComposition = (steps: number[]): CreateSchemaRequest["composition"] => ({
  repetition: { kind: "ladder", steps },
});

const renderRunner = () => {
  const queryClient = new QueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const view = renderHook(() => useCreateIndependentLadders(PLAN_ID, START_DATE), { wrapper });

  return { view, invalidateSpy };
};

describe("useCreateIndependentLadders", () => {
  beforeEach(() => {
    createMock.mockReset();
    toastSuccessMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fires one create per track with the per-track ladder composition and no parentSchemaId (MT-15a)", async () => {
    createMock.mockResolvedValue(schemaStub("created-1"));

    const { view, invalidateSpy } = renderRunner();
    const onSuccess = vi.fn();
    const onError = vi.fn();

    await act(async () => {
      await view.result.current.run(
        {
          blockId: BLOCK_ID,
          draft: parentDraft([
            ladderTrack("t1", FIRST_LADDER_STEPS),
            ladderTrack("t2", SECOND_LADDER_STEPS),
          ]),
        },
        { onSuccess, onError },
      );
    });

    expect(createMock).toHaveBeenCalledTimes(2);
    expect(createMock).toHaveBeenNthCalledWith(1, PLAN_ID, {
      blockId: BLOCK_ID,
      composition: ladderComposition(FIRST_LADDER_STEPS),
      header: null,
      notes: null,
    });
    expect(createMock).toHaveBeenNthCalledWith(2, PLAN_ID, {
      blockId: BLOCK_ID,
      composition: ladderComposition(SECOND_LADDER_STEPS),
      header: null,
      notes: null,
    });
    expect(createMock.mock.calls[0]?.[1]).not.toHaveProperty("parentSchemaId");
    expect(toastSuccessMock).toHaveBeenCalledTimes(1);
    expect(toastSuccessMock).toHaveBeenCalledWith(SUCCESS_MESSAGE);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: platformKeys.weeks.byDate(PLAN_ID, START_DATE),
    });
  });

  it("forwards an incoming parentSchemaId on every create (MT-15b)", async () => {
    createMock.mockResolvedValue(schemaStub("created-1"));

    const { view } = renderRunner();

    await act(async () => {
      await view.result.current.run(
        {
          blockId: BLOCK_ID,
          parentSchemaId: INCOMING_PARENT_ID,
          draft: parentDraft([
            ladderTrack("t1", FIRST_LADDER_STEPS),
            ladderTrack("t2", SECOND_LADDER_STEPS),
          ]),
        },
        { onSuccess: vi.fn(), onError: vi.fn() },
      );
    });

    expect(createMock).toHaveBeenCalledTimes(2);
    expect(createMock).toHaveBeenNthCalledWith(1, PLAN_ID, {
      blockId: BLOCK_ID,
      parentSchemaId: INCOMING_PARENT_ID,
      composition: ladderComposition(FIRST_LADDER_STEPS),
      header: null,
      notes: null,
    });
    expect(createMock).toHaveBeenNthCalledWith(2, PLAN_ID, {
      blockId: BLOCK_ID,
      parentSchemaId: INCOMING_PARENT_ID,
      composition: ladderComposition(SECOND_LADDER_STEPS),
      header: null,
      notes: null,
    });
  });

  it("stops on the first failure with no rollback, one invalidation and a partial message (MT-16)", async () => {
    createMock
      .mockResolvedValueOnce(schemaStub("created-1"))
      .mockRejectedValueOnce(new Error("network exploded"))
      .mockResolvedValueOnce(schemaStub("created-3"));

    const { view, invalidateSpy } = renderRunner();
    const onSuccess = vi.fn();
    const onError = vi.fn();

    await act(async () => {
      await view.result.current.run(
        {
          blockId: BLOCK_ID,
          draft: parentDraft([
            ladderTrack("t1", FIRST_LADDER_STEPS),
            ladderTrack("t2", SECOND_LADDER_STEPS),
            ladderTrack("t3", THIRD_LADDER_STEPS),
          ]),
        },
        { onSuccess, onError },
      );
    });

    expect(createMock).toHaveBeenCalledTimes(2);
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      "Created 1 of 3 ladders; the rest failed: network exploded",
    );
    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("calls onError without any create or invalidation when fewer than two tracks (MT-17)", async () => {
    const { view, invalidateSpy } = renderRunner();
    const onSuccess = vi.fn();
    const onError = vi.fn();

    await act(async () => {
      await view.result.current.run(
        { blockId: BLOCK_ID, draft: parentDraft([ladderTrack("t1", FIRST_LADDER_STEPS)]) },
        { onSuccess, onError },
      );
    });

    expect(createMock).not.toHaveBeenCalled();
    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      "Expected a parallel draft with at least two ladder tracks.",
    );
    expect(view.result.current.isPending).toBe(false);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });

  it("validates a degenerate step client-side and surfaces a coach message before any create (MT-20, QA-003 fix)", async () => {
    const { view, invalidateSpy } = renderRunner();
    const onSuccess = vi.fn();
    const onError = vi.fn();

    await act(async () => {
      await view.result.current.run(
        {
          blockId: BLOCK_ID,
          draft: parentDraft([ladderTrack("t1", [0]), ladderTrack("t2", SECOND_LADDER_STEPS)]),
        },
        { onSuccess, onError },
      );
    });

    expect(createMock).not.toHaveBeenCalled();
    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toMatch(/^ladder 1/);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });

  it("toggles isPending true while running then back to false", async () => {
    let resolveCreate: ((schema: Schema) => void) | undefined;
    const pendingCreate = new Promise<Schema>((resolve) => {
      resolveCreate = resolve;
    });

    createMock.mockReturnValueOnce(pendingCreate).mockResolvedValueOnce(schemaStub("created-2"));

    const { view } = renderRunner();

    expect(view.result.current.isPending).toBe(false);

    let runPromise: Promise<void> = Promise.resolve();

    await act(async () => {
      runPromise = view.result.current.run(
        {
          blockId: BLOCK_ID,
          draft: parentDraft([
            ladderTrack("t1", FIRST_LADDER_STEPS),
            ladderTrack("t2", SECOND_LADDER_STEPS),
          ]),
        },
        { onSuccess: vi.fn(), onError: vi.fn() },
      );
    });

    expect(view.result.current.isPending).toBe(true);

    await act(async () => {
      resolveCreate?.(schemaStub("created-1"));
      await runPromise;
    });

    expect(view.result.current.isPending).toBe(false);
  });
});
