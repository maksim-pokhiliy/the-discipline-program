import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  type CreateBenchmarkResultRequest,
  type CreateBenchmarkResultResponse,
} from "@repo/contracts/lms/benchmark-result";
import type * as Query from "@repo/query";

const createBenchmarkResultMock =
  vi.fn<
    (
      sessionId: string,
      data: CreateBenchmarkResultRequest,
      idempotencyKey?: string,
    ) => Promise<CreateBenchmarkResultResponse>
  >();
const toastSuccessMock = vi.fn<(message: string) => void>();
const notifyErrorMock = vi.fn<(error: Error, fallback: string) => void>();

vi.mock("../api", () => ({
  api: {
    benchmarkResults: {
      create: (sessionId: string, data: CreateBenchmarkResultRequest, idempotencyKey?: string) =>
        createBenchmarkResultMock(sessionId, data, idempotencyKey),
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

const { useLogBenchmarkResult } = await import("./use-benchmark-results");

const SESSION_ID = "clp9z8x7w0000abcd1234sess";
const SCHEMA_ID = "clp9z8x7w0000abcd1234schm";

const makeBenchmarkRequest = (
  overrides: Partial<CreateBenchmarkResultRequest> = {},
): CreateBenchmarkResultRequest => ({
  plannedSchemaId: SCHEMA_ID,
  result: { type: "load", kg: 100 },
  ...overrides,
});

const makeBenchmarkResponse = (
  overrides: Partial<CreateBenchmarkResultResponse> = {},
): CreateBenchmarkResultResponse => ({
  id: "clp9z8x7w0000abcd1234bres",
  userId: "clp9z8x7w0000abcd1234usr0",
  plannedSchemaId: SCHEMA_ID,
  result: { type: "load", kg: 100 },
  recordedAt: new Date("2026-01-06T00:00:00.000Z"),
  createdAt: new Date("2026-01-06T00:00:00.000Z"),
  ...overrides,
});

const renderRunner = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  return renderHook(() => useLogBenchmarkResult(), { wrapper });
};

const keyAt = (index: number): string | undefined =>
  createBenchmarkResultMock.mock.calls[index]?.[2];

describe("useLogBenchmarkResult", () => {
  beforeEach(() => {
    createBenchmarkResultMock.mockReset();
    toastSuccessMock.mockReset();
    notifyErrorMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reuses the idempotency key across retries until success", async () => {
    createBenchmarkResultMock.mockReturnValue(
      new Promise<CreateBenchmarkResultResponse>(() => undefined),
    );

    const { result } = renderRunner();

    await act(async () => {
      result.current.mutate({ sessionId: SESSION_ID, data: makeBenchmarkRequest() });
      result.current.mutate({ sessionId: SESSION_ID, data: makeBenchmarkRequest() });
    });

    await waitFor(() => expect(createBenchmarkResultMock).toHaveBeenCalledTimes(2));

    expect(typeof keyAt(0)).toBe("string");
    expect(keyAt(1)).toBe(keyAt(0));
  });

  it("mints a new key after a successful submit", async () => {
    createBenchmarkResultMock.mockResolvedValue(makeBenchmarkResponse());

    const { result } = renderRunner();

    await act(async () => {
      await result.current.mutateAsync({ sessionId: SESSION_ID, data: makeBenchmarkRequest() });
    });

    await act(async () => {
      await result.current.mutateAsync({ sessionId: SESSION_ID, data: makeBenchmarkRequest() });
    });

    expect(typeof keyAt(0)).toBe("string");
    expect(keyAt(1)).not.toBe(keyAt(0));
  });
});
