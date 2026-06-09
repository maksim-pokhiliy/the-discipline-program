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

const { useCreateParallelSchemas } = await import("./use-create-parallel-schemas");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const PARENT_CUID = "clp9z8x7w0000abcd1234par1";
const TRACK_CUID = "clp9z8x7w0000abcd1234trk1";
const INCOMING_PARENT_ID = "clp9z8x7w0000abcd1234inc1";
const NOW = new Date("2026-01-06T00:00:00.000Z");

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

const parentDraft = (children: ComposeNode[], header: string | null = null): ComposeContainer => ({
  nodeType: "container",
  id: asNodeId("parent-draft-1"),
  header,
  notes: null,
  children,
});

const renderSequencer = () => {
  const queryClient = new QueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const view = renderHook(() => useCreateParallelSchemas(PLAN_ID, START_DATE), { wrapper });

  return { view, invalidateSpy };
};

describe("useCreateParallelSchemas", () => {
  beforeEach(() => {
    createMock.mockReset();
    toastSuccessMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates the parent then each track, threading the parent's returned id", async () => {
    createMock
      .mockResolvedValueOnce(schemaStub(PARENT_CUID))
      .mockResolvedValueOnce(schemaStub(TRACK_CUID))
      .mockResolvedValueOnce(schemaStub("clp9z8x7w0000abcd1234trk2"));

    const { view, invalidateSpy } = renderSequencer();
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

    expect(createMock).toHaveBeenCalledTimes(3);
    expect(createMock).toHaveBeenNthCalledWith(1, PLAN_ID, {
      blockId: BLOCK_ID,
      composition: {},
      header: null,
      notes: null,
    });
    expect(createMock).toHaveBeenNthCalledWith(2, PLAN_ID, {
      blockId: BLOCK_ID,
      parentSchemaId: PARENT_CUID,
      composition: { repetition: { kind: "ladder", steps: [21, 15, 9] } },
      header: null,
      notes: null,
    });
    expect(createMock).toHaveBeenNthCalledWith(3, PLAN_ID, {
      blockId: BLOCK_ID,
      parentSchemaId: PARENT_CUID,
      composition: { repetition: { kind: "ladder", steps: [15, 12, 9] } },
      header: null,
      notes: null,
    });
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: platformKeys.weeks.byDate(PLAN_ID, START_DATE),
    });
    expect(toastSuccessMock).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it("never hits the network when a track has zero steps", async () => {
    const { view, invalidateSpy } = renderSequencer();
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

    expect(createMock).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toMatch(/ladder 2/);
    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("surfaces the failure and invalidates once when a mid-sequence create rejects", async () => {
    const failure = new Error("network exploded");

    createMock.mockResolvedValueOnce(schemaStub(PARENT_CUID)).mockRejectedValueOnce(failure);

    const { view, invalidateSpy } = renderSequencer();
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

    expect(createMock).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith("network exploded");
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("toggles isPending true while running then back to false", async () => {
    let resolveParent: ((schema: Schema) => void) | undefined;
    const parentPending = new Promise<Schema>((resolve) => {
      resolveParent = resolve;
    });

    createMock.mockReturnValueOnce(parentPending).mockResolvedValue(schemaStub(TRACK_CUID));

    const { view } = renderSequencer();

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
      resolveParent?.(schemaStub(PARENT_CUID));
      await runPromise;
    });

    expect(view.result.current.isPending).toBe(false);
  });

  it("forwards an incoming parentSchemaId to the materialized parent and threads the new parent id to tracks", async () => {
    createMock
      .mockResolvedValueOnce(schemaStub(PARENT_CUID))
      .mockResolvedValueOnce(schemaStub(TRACK_CUID))
      .mockResolvedValueOnce(schemaStub("clp9z8x7w0000abcd1234trk2"));

    const { view } = renderSequencer();

    await act(async () => {
      await view.result.current.run(
        {
          blockId: BLOCK_ID,
          parentSchemaId: INCOMING_PARENT_ID,
          draft: parentDraft([ladderTrack("t1", [21, 15, 9]), ladderTrack("t2", [15, 12, 9])]),
        },
        { onSuccess: vi.fn(), onError: vi.fn() },
      );
    });

    expect(createMock).toHaveBeenNthCalledWith(1, PLAN_ID, {
      blockId: BLOCK_ID,
      parentSchemaId: INCOMING_PARENT_ID,
      composition: {},
      header: null,
      notes: null,
    });
    expect(createMock).toHaveBeenNthCalledWith(2, PLAN_ID, {
      blockId: BLOCK_ID,
      parentSchemaId: PARENT_CUID,
      composition: { repetition: { kind: "ladder", steps: [21, 15, 9] } },
      header: null,
      notes: null,
    });
  });
});
