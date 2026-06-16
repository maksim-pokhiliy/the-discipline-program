import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SchemaRow } from "@repo/contracts/lms/schema-row";
import type * as Query from "@repo/query";

import { platformKeys } from "../api/keys";

const duplicateSchemaRowMock = vi.fn<(planId: string, schemaRowId: string) => Promise<SchemaRow>>();
const toastSuccessMock = vi.fn<(message: string) => void>();
const notifyErrorMock = vi.fn<(error: Error, fallback: string) => void>();

vi.mock("../api", () => ({
  api: {
    schemaRows: {
      duplicate: (planId: string, schemaRowId: string) =>
        duplicateSchemaRowMock(planId, schemaRowId),
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

const { useDuplicateSchemaRow } = await import("./use-schema-rows");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const ROW_ID = "clp9z8x7w0000abcd1234row0";

const makeSchemaRow = (overrides: Partial<SchemaRow> = {}): SchemaRow => ({
  id: ROW_ID,
  schemaId: "clp9z8x7w0000abcd1234schm",
  order: 1,
  exerciseId: "clp9z8x7w0000abcd1234exer",
  sets: null,
  rowGroupId: null,
  load: null,
  reps: null,
  side: null,
  tempo: null,
  media: null,
  modifiers: [],
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
  const view = renderHook(() => useDuplicateSchemaRow(PLAN_ID, START_DATE), { wrapper });

  return { view, invalidateSpy };
};

describe("useDuplicateSchemaRow", () => {
  beforeEach(() => {
    duplicateSchemaRowMock.mockReset();
    toastSuccessMock.mockReset();
    notifyErrorMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls the schema-row duplicate endpoint with the plan and row ids", async () => {
    duplicateSchemaRowMock.mockResolvedValueOnce(makeSchemaRow());

    const { view } = renderRunner();

    await act(async () => {
      view.result.current.mutate({ schemaRowId: ROW_ID });
    });

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(duplicateSchemaRowMock).toHaveBeenCalledWith(PLAN_ID, ROW_ID);
  });

  it("invalidates the week query and stays silent (no success toast) on success", async () => {
    duplicateSchemaRowMock.mockResolvedValueOnce(makeSchemaRow());

    const { view, invalidateSpy } = renderRunner();

    await act(async () => {
      view.result.current.mutate({ schemaRowId: ROW_ID });
    });

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: platformKeys.weeks.byDate(PLAN_ID, START_DATE),
    });
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });

  it("notifies the error fallback when the duplicate rejects", async () => {
    const failure = new Error("boom");

    duplicateSchemaRowMock.mockRejectedValueOnce(failure);

    const { view } = renderRunner();

    await act(async () => {
      view.result.current.mutate({ schemaRowId: ROW_ID });
    });

    await waitFor(() => expect(view.result.current.isError).toBe(true));

    expect(notifyErrorMock).toHaveBeenCalledWith(failure, "Couldn't duplicate — try again.");
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });
});
