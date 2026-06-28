import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  type CreateOneRMRecordRequest,
  type CreateOneRMRecordResponse,
  OneRMRecordSource,
} from "@repo/contracts/lms/one-rm-record";
import type * as Query from "@repo/query";

const createOneRMRecordMock =
  vi.fn<
    (data: CreateOneRMRecordRequest, idempotencyKey?: string) => Promise<CreateOneRMRecordResponse>
  >();
const toastSuccessMock = vi.fn<(message: string) => void>();
const notifyErrorMock = vi.fn<(error: Error, fallback: string) => void>();

vi.mock("../api", () => ({
  api: {
    oneRMRecords: {
      create: (data: CreateOneRMRecordRequest, idempotencyKey?: string) =>
        createOneRMRecordMock(data, idempotencyKey),
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

const { useCreateOneRMRecord } = await import("./use-one-rm-records");

const EXERCISE_ID = "clp9z8x7w0000abcd1234exrc";

const makeOneRMRequest = (
  overrides: Partial<CreateOneRMRecordRequest> = {},
): CreateOneRMRecordRequest => ({
  exerciseId: EXERCISE_ID,
  valueKg: 100,
  recordedAt: new Date("2026-01-06T00:00:00.000Z"),
  source: OneRMRecordSource.MANUAL,
  ...overrides,
});

const makeOneRMResponse = (
  overrides: Partial<CreateOneRMRecordResponse> = {},
): CreateOneRMRecordResponse => ({
  id: "clp9z8x7w0000abcd1234rec0",
  userId: "clp9z8x7w0000abcd1234usr0",
  exerciseId: EXERCISE_ID,
  valueKg: 100,
  recordedAt: new Date("2026-01-06T00:00:00.000Z"),
  source: OneRMRecordSource.MANUAL,
  ...overrides,
});

const renderRunner = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  return renderHook(() => useCreateOneRMRecord(), { wrapper });
};

const keyAt = (index: number): string | undefined => createOneRMRecordMock.mock.calls[index]?.[1];

describe("useCreateOneRMRecord", () => {
  beforeEach(() => {
    createOneRMRecordMock.mockReset();
    toastSuccessMock.mockReset();
    notifyErrorMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reuses the idempotency key across retries until success", async () => {
    createOneRMRecordMock.mockReturnValue(new Promise<CreateOneRMRecordResponse>(() => undefined));

    const { result } = renderRunner();

    await act(async () => {
      result.current.mutate(makeOneRMRequest());
      result.current.mutate(makeOneRMRequest());
    });

    await waitFor(() => expect(createOneRMRecordMock).toHaveBeenCalledTimes(2));

    expect(typeof keyAt(0)).toBe("string");
    expect(keyAt(1)).toBe(keyAt(0));
  });

  it("mints a new key after a successful submit", async () => {
    createOneRMRecordMock.mockResolvedValue(makeOneRMResponse());

    const { result } = renderRunner();

    await act(async () => {
      await result.current.mutateAsync(makeOneRMRequest());
    });

    await act(async () => {
      await result.current.mutateAsync(makeOneRMRequest());
    });

    expect(typeof keyAt(0)).toBe("string");
    expect(keyAt(1)).not.toBe(keyAt(0));
  });

  it("keeps the key after an error so a manual retry dedupes", async () => {
    createOneRMRecordMock
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(makeOneRMResponse());

    const { result } = renderRunner();

    await act(async () => {
      await result.current.mutateAsync(makeOneRMRequest()).catch(() => undefined);
    });

    await act(async () => {
      await result.current.mutateAsync(makeOneRMRequest());
    });

    expect(typeof keyAt(0)).toBe("string");
    expect(keyAt(1)).toBe(keyAt(0));
    expect(notifyErrorMock).toHaveBeenCalledWith(expect.any(Error), "Failed to save 1RM");
  });
});
