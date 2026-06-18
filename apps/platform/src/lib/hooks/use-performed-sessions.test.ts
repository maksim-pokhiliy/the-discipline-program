import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  CreatePerformedSessionRequest,
  CreatePerformedSessionResponse,
} from "@repo/contracts/lms/performed-session";
import type * as Query from "@repo/query";

const createMock =
  vi.fn<(data: CreatePerformedSessionRequest) => Promise<CreatePerformedSessionResponse>>();
const notifyErrorMock = vi.fn();

vi.mock("../api", () => ({
  api: {
    performedSessions: {
      create: (data: CreatePerformedSessionRequest) => createMock(data),
    },
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@repo/query", async (importOriginal) => {
  const actual = await importOriginal<typeof Query>();

  return {
    ...actual,
    notifyError: (error: unknown, fallback: string) => notifyErrorMock(error, fallback),
  };
});

const { useCreatePerformedSession } = await import("./use-performed-sessions");

const SESSION_ID = "clz000000000000000000sess1";

class ValidationError extends Error {
  readonly details: { issues: { path: string; message: string }[] };

  constructor(message: string, issues: { path: string; message: string }[]) {
    super(message);
    this.details = { issues };
  }
}

const renderRunner = () => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  return renderHook(() => useCreatePerformedSession(), { wrapper });
};

const PERFORMED_AT = new Date("2026-06-18T12:00:00.000Z");

const request: CreatePerformedSessionRequest = {
  sessionId: SESSION_ID,
  performedAt: PERFORMED_AT,
  athleteNotes: null,
  results: [],
};

const response: CreatePerformedSessionResponse = {
  id: "clz00000000000000000perf01",
  sessionId: SESSION_ID,
  userId: "clz0000000000000000user01",
  performedAt: PERFORMED_AT,
  coachNotes: null,
  athleteNotes: null,
  createdAt: PERFORMED_AT,
  updatedAt: PERFORMED_AT,
};

describe("useCreatePerformedSession", () => {
  beforeEach(() => {
    createMock.mockReset();
    notifyErrorMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("surfaces a server result-type-mismatch guard rejection through notifyError (QA-014)", async () => {
    const error = new ValidationError("Invalid result", [
      { path: "results.0.result.type", message: "Result type does not match the benchmark" },
    ]);

    createMock.mockRejectedValueOnce(error);

    const view = renderRunner();

    await act(async () => {
      view.result.current.mutate(request);
    });

    await waitFor(() => expect(view.result.current.isError).toBe(true));

    expect(notifyErrorMock).toHaveBeenCalledWith(error, "Failed to log session");
  });

  it("does not call notifyError on a successful log", async () => {
    createMock.mockResolvedValueOnce(response);

    const view = renderRunner();

    await act(async () => {
      view.result.current.mutate(request);
    });

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(notifyErrorMock).not.toHaveBeenCalled();
  });
});
