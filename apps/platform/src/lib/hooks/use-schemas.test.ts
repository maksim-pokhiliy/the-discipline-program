import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Schema } from "@repo/contracts/lms/schema";
import type * as Query from "@repo/query";

import { platformKeys } from "../api/keys";

const duplicateSchemaMock = vi.fn<(planId: string, schemaId: string) => Promise<Schema>>();
const toastSuccessMock = vi.fn<(message: string) => void>();
const notifyErrorMock = vi.fn<(error: Error, fallback: string) => void>();

vi.mock("../api", () => ({
  api: {
    schemas: {
      duplicate: (planId: string, schemaId: string) => duplicateSchemaMock(planId, schemaId),
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

const { useDuplicateSchema } = await import("./use-schemas");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const SCHEMA_ID = "clp9z8x7w0000abcd1234schm";

const makeSchema = (overrides: Partial<Schema> = {}): Schema => ({
  id: SCHEMA_ID,
  blockId: "clp9z8x7w0000abcd1234blk0",
  groupId: null,
  order: 1,
  header: null,
  intensity: null,
  composition: null,
  label: null,
  notes: null,
  createdAt: new Date("2026-01-06T00:00:00.000Z"),
  updatedAt: new Date("2026-01-06T00:00:00.000Z"),
  ...overrides,
});

const renderRunner = () => {
  const queryClient = new QueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const view = renderHook(() => useDuplicateSchema(PLAN_ID, START_DATE), { wrapper });

  return { view, invalidateSpy };
};

describe("useDuplicateSchema", () => {
  beforeEach(() => {
    duplicateSchemaMock.mockReset();
    toastSuccessMock.mockReset();
    notifyErrorMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls the schema duplicate endpoint with the plan and schema ids", async () => {
    duplicateSchemaMock.mockResolvedValueOnce(makeSchema());

    const { view } = renderRunner();

    await act(async () => {
      view.result.current.mutate({ schemaId: SCHEMA_ID });
    });

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(duplicateSchemaMock).toHaveBeenCalledWith(PLAN_ID, SCHEMA_ID);
  });

  it("invalidates the week query and stays silent (no success toast) on success", async () => {
    duplicateSchemaMock.mockResolvedValueOnce(makeSchema());

    const { view, invalidateSpy } = renderRunner();

    await act(async () => {
      view.result.current.mutate({ schemaId: SCHEMA_ID });
    });

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: platformKeys.weeks.byDate(PLAN_ID, START_DATE),
    });
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });

  it("notifies the error fallback when the duplicate rejects", async () => {
    const failure = new Error("boom");

    duplicateSchemaMock.mockRejectedValueOnce(failure);

    const { view } = renderRunner();

    await act(async () => {
      view.result.current.mutate({ schemaId: SCHEMA_ID });
    });

    await waitFor(() => expect(view.result.current.isError).toBe(true));

    expect(notifyErrorMock).toHaveBeenCalledWith(failure, "Couldn't duplicate — try again.");
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });
});
